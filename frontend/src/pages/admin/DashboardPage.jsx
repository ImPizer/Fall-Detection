import React, { useCallback, useEffect, useMemo, useState } from "react";
import Badge from "../../components/ui/Badge.jsx";
import Card from "../../components/ui/Card.jsx";
import useEventStream from "../../hooks/useEventStream.js";
import { apiFetch } from "../../services/api.js";
import { formatVNTime } from "../../services/time.js";
import { getSeverity } from "../../services/eventUtils.js";

function severityTone(severity) {
  if (severity === "critical") return "critical";
  if (severity === "high") return "high";
  if (severity === "medium") return "medium";
  return "low";
}

export default function AdminDashboardPage() {
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
    const pending = events.filter((e) => !e.ack).length;
    const acked = events.filter((e) => e.ack).length;
    const critical = events.filter((e) => getSeverity(e.confidence) === "critical").length;
    const online = cameras.filter((c) => c.enabled).length;
    return { total, pending, acked, critical, online };
  }, [events, cameras]);

  function cameraName(id) {
    const c = cameras.find((cam) => cam.id === id);
    return c ? c.name : `Camera ${id || "-"}`;
  }

  return (
    <div className="page-stack">
      <div className="kpi-grid">
        <Card><div className="kpi-label">Total Incidents</div><div className="kpi-value">{stats.total}</div></Card>
        <Card><div className="kpi-label">New</div><div className="kpi-value">{stats.pending}</div></Card>
        <Card><div className="kpi-label">Acked</div><div className="kpi-value">{stats.acked}</div></Card>
        <Card><div className="kpi-label">Critical</div><div className="kpi-value">{stats.critical}</div></Card>
        <Card><div className="kpi-label">Cameras Online</div><div className="kpi-value">{stats.online}</div></Card>
      </div>

      <Card>
        <div className="section-head">
          <div>
            <h2>Recent Incident Feed</h2>
            <p>Latest events across all monitored cameras.</p>
          </div>
        </div>
        <div className="timeline-list">
          {events.slice(0, 10).map((event) => {
            const severity = getSeverity(event.confidence);
            return (
              <div key={event.id} className="timeline-row">
                <div>
                  <strong>#{event.id}</strong> - {cameraName(event.camera_id)}
                  <div className="muted-text">{formatVNTime(event.ts)}</div>
                </div>
                <div className="inline-actions">
                  <Badge tone={severityTone(severity)} pulse={severity === "critical"}>{severity}</Badge>
                  <Badge tone={event.ack ? "ack" : "new"}>{event.ack ? "ACK" : "NEW"}</Badge>
                </div>
              </div>
            );
          })}
          {events.length === 0 && <div className="empty-panel">No incidents recorded.</div>}
        </div>
      </Card>
    </div>
  );
}
