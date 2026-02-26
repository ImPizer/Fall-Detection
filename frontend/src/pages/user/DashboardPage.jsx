import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
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

export default function UserDashboardPage() {
  const [events, setEvents] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);

  const columns = [
    { key: "time", label: "Time" },
    { key: "camera", label: "Camera" },
    { key: "severity", label: "Severity" },
    { key: "status", label: "Status" },
    { key: "detail", label: "Detail" }
  ];

  useEffect(() => {
    Promise.all([
      apiFetch("/events"),
      apiFetch("/cameras")
    ])
      .then(([eventData, cameraData]) => {
        setEvents(eventData);
        setCameras(cameraData);
      })
      .catch(() => {
        setEvents([]);
        setCameras([]);
      })
      .finally(() => setLoading(false));
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

  const summary = useMemo(() => {
    const total = events.length;
    const pending = events.filter((e) => !e.ack).length;
    const critical = events.filter((e) => getSeverity(e.confidence) === "critical").length;
    return { total, pending, critical };
  }, [events]);

  function cameraName(id) {
    const c = cameras.find((cam) => cam.id === id);
    return c ? c.name : `Camera ${id || "-"}`;
  }

  return (
    <div className="page-stack">
      <div className="kpi-grid">
        <Card>
          <div className="kpi-label">Total Incidents</div>
          <div className="kpi-value">{summary.total}</div>
        </Card>
        <Card>
          <div className="kpi-label">Pending</div>
          <div className="kpi-value">{summary.pending}</div>
        </Card>
        <Card>
          <div className="kpi-label">Critical</div>
          <div className="kpi-value">{summary.critical}</div>
        </Card>
      </div>

      <Card>
        <div className="section-head">
          <div>
            <h2>My Incidents</h2>
            <p>Review events, status, and evidence quickly.</p>
          </div>
          <Link to="/app/events">
            <Button variant="secondary">Open Events</Button>
          </Link>
        </div>

        <DataTable columns={columns} loading={loading} rowsCount={events.length} emptyText="No incidents yet.">
          {events.slice(0, 8).map((event) => {
            const severity = getSeverity(event.confidence);
            return (
              <tr key={event.id}>
                <td>{formatVNTime(event.ts)}</td>
                <td>{cameraName(event.camera_id)}</td>
                <td>
                  <Badge tone={severityTone(severity)} pulse={severity === "critical"}>
                    {severity}
                  </Badge>
                </td>
                <td>
                  <Badge tone={event.ack ? "ack" : "new"}>{event.ack ? "ACK" : "NEW"}</Badge>
                </td>
                <td>
                  <Link className="link-inline" to={`/app/events/${event.id}`}>
                    View
                  </Link>
                </td>
              </tr>
            );
          })}
        </DataTable>

        {!loading && events.length === 0 && (
          <div className="empty-state">
            <h3>No incidents yet</h3>
            <p>Incidents detected by your assigned cameras will appear here.</p>
            <Link to="/app/live">
              <Button variant="secondary">Go to Live View</Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}
