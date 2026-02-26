import React, { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../services/api.js";
import { getSeverity, severityClass, statusClass, statusLabel } from "../services/eventUtils.js";
import useEventStream from "../hooks/useEventStream.js";
import { formatVNTime } from "../services/time.js";

export default function AdminDashboard() {
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
    const total = events.length;
    const online = cameras.filter((c) => c.enabled).length;
    const unacked = events.filter((e) => !e.ack).length;
    const falsePositiveRate = "N/A";
    const lastDetected = events[0]?.ts ? formatVNTime(events[0].ts) : "N/A";
    return { total, online, unacked, lastDetected, falsePositiveRate };
  }, [events, cameras]);

  function cameraName(cameraId) {
    const cam = cameras.find((c) => c.id === cameraId);
    return cam ? cam.name : `Camera ${cameraId || "-"}`;
  }

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="grid cols-4">
        <div className="card stat">
          <div className="stat-label">Total Events</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="card stat">
          <div className="stat-label">Cameras Online</div>
          <div className="stat-value">{stats.online}</div>
        </div>
        <div className="card stat">
          <div className="stat-label">Pending Review</div>
          <div className="stat-value">{stats.unacked}</div>
        </div>
        <div className="card stat">
          <div className="stat-label">False Positive Rate</div>
          <div className="stat-value small">{stats.falsePositiveRate}</div>
        </div>
      </div>
      <div className="card stat">
        <div className="stat-label">Last Detected</div>
        <div className="stat-value small">{stats.lastDetected}</div>
      </div>

      <div className="card">
        <div className="header">
          <h3>Incident Timeline</h3>
          <span className="badge">System-wide</span>
        </div>
        <div className="timeline-list">
          {events.slice(0, 10).map((e) => (
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
