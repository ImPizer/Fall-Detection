import React, { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../services/api.js";
import { getSeverity, severityClass, statusClass, statusLabel } from "../services/eventUtils.js";
import useEventStream from "../hooks/useEventStream.js";
import { dateKeyVN, formatVNTime, parseEventTime } from "../services/time.js";

export default function UserDashboard() {
  const [events, setEvents] = useState([]);
  const [cameras, setCameras] = useState([]);

  useEffect(() => {
    apiFetch("/events").then(setEvents).catch(() => setEvents([]));
    apiFetch("/cameras").then(setCameras).catch(() => setCameras([]));
  }, []);

  const onStreamEvent = useCallback((incoming) => {
    setEvents((prev) => {
      if (prev.some((e) => e.id === incoming.event_id)) return prev;
      return [
        {
          id: incoming.event_id,
          camera_id: incoming.camera_id,
          ts: incoming.ts,
          confidence: incoming.confidence,
          severity: incoming.severity || getSeverity(incoming.confidence),
          ack: false
        },
        ...prev
      ];
    });
  }, []);

  useEventStream(onStreamEvent);

  const stats = useMemo(() => {
    const now = new Date();
    const todayKey = dateKeyVN(now.toISOString());
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    const today = events.filter((e) => dateKeyVN(e.ts) === todayKey).length;
    const week = events.filter((e) => parseEventTime(e.ts) >= weekAgo).length;
    const unacked = events.filter((e) => !e.ack).length;
    return { today, week, unacked };
  }, [events]);

  function cameraName(cameraId) {
    const cam = cameras.find((c) => c.id === cameraId);
    return cam ? cam.name : `Camera ${cameraId || "-"}`;
  }

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="grid cols-3">
        <div className="card stat">
          <div className="stat-label">Falls Today</div>
          <div className="stat-value">{stats.today}</div>
        </div>
        <div className="card stat">
          <div className="stat-label">Falls This Week</div>
          <div className="stat-value">{stats.week}</div>
        </div>
        <div className="card stat">
          <div className="stat-label">New Events</div>
          <div className="stat-value">{stats.unacked}</div>
        </div>
      </div>

      <div className="card">
        <div className="header">
          <h3>Incident Timeline</h3>
          <span className="badge">Recent</span>
        </div>
        <div className="timeline-list">
          {events.slice(0, 8).map((e) => (
            <div className="timeline-item" key={e.id}>
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <div>
                  {formatVNTime(e.ts)} - {cameraName(e.camera_id)}
                </div>
                <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
                  <span className={severityClass(getSeverity(e.confidence))}>
                    {getSeverity(e.confidence)}
                  </span>
                  <span className={statusClass(e)}>{statusLabel(e)}</span>
                </div>
              </div>
            </div>
          ))}
          {events.length === 0 && <div>No incidents recorded.</div>}
        </div>
      </div>
    </div>
  );
}
