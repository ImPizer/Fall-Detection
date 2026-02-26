import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Card from "../../components/ui/Card.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import Modal from "../../components/ui/Modal.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import useEventStream from "../../hooks/useEventStream.js";
import { apiFetch, downloadEventsCsv } from "../../services/api.js";
import { formatVNTime } from "../../services/time.js";
import { getSeverity } from "../../services/eventUtils.js";

function severityTone(severity) {
  if (severity === "critical") return "critical";
  if (severity === "high") return "high";
  if (severity === "medium") return "medium";
  return "low";
}

function statusTone(event) {
  return event.ack ? "ack" : "new";
}

export default function EventsPage({ mode = "admin" }) {
  const auth = useAuth();
  const { pushToast } = useToast();
  const [events, setEvents] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newRowIds, setNewRowIds] = useState(() => new Set());
  const [confirm, setConfirm] = useState(null);
  const [filters, setFilters] = useState({ from: "", to: "", camera_id: "", status: "" });

  const columns = useMemo(
    () => [
      { key: "id", label: "ID" },
      { key: "camera", label: "Camera" },
      { key: "time", label: "Detected Time" },
      { key: "severity", label: "Severity" },
      { key: "confidence", label: "Confidence" },
      { key: "status", label: "Status" },
      { key: "detail", label: "Detail" },
      { key: "action", label: "Action" }
    ],
    []
  );

  const summary = useMemo(() => {
    const total = events.length;
    const critical = events.filter((e) => getSeverity(e.confidence) === "critical").length;
    const pending = events.filter((e) => !e.ack).length;
    return { total, critical, pending };
  }, [events]);

  async function loadEvents({ silent = false } = {}) {
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const query = new URLSearchParams();
      if (filters.from) query.set("from", filters.from);
      if (filters.to) query.set("to", filters.to);
      if (filters.camera_id) query.set("cameraId", filters.camera_id);
      if (filters.status) query.set("status", filters.status);
      const qs = query.toString() ? `?${query.toString()}` : "";
      const data = await apiFetch(`/events${qs}`);
      setEvents(data);
    } catch {
      setEvents([]);
      pushToast("Failed to load events", "error");
    } finally {
      setLoading(false);
      window.setTimeout(() => setRefreshing(false), 180);
    }
  }

  useEffect(() => {
    loadEvents().catch(() => null);
    apiFetch("/cameras").then(setCameras).catch(() => setCameras([]));
  }, []);

  const onStreamEvent = useCallback((incoming) => {
    setEvents((prev) => {
      if (prev.some((e) => e.id === incoming.event_id)) return prev;
      const next = [
        {
          id: incoming.event_id,
          camera_id: incoming.camera_id,
          ts: incoming.ts,
          confidence: incoming.confidence,
          severity: incoming.severity || getSeverity(incoming.confidence),
          ack: false,
          ack_by: null
        },
        ...prev
      ].slice(0, 200);

      setNewRowIds((oldSet) => {
        const nextSet = new Set(oldSet);
        nextSet.add(incoming.event_id);
        return nextSet;
      });
      window.setTimeout(() => {
        setNewRowIds((oldSet) => {
          const nextSet = new Set(oldSet);
          nextSet.delete(incoming.event_id);
          return nextSet;
        });
      }, 1200);

      return next;
    });
  }, []);

  useEventStream(onStreamEvent);

  function cameraName(cameraId) {
    const cam = cameras.find((c) => c.id === cameraId);
    return cam ? cam.name : cameraId ? `Camera ${cameraId}` : "Unknown";
  }

  async function ackEvent(eventId) {
    try {
      await apiFetch(`/events/${eventId}/ack`, {
        method: "PATCH",
        body: JSON.stringify({ ack_by: auth.user })
      });
      pushToast("Event updated", "success");
      await loadEvents({ silent: true });
    } catch {
      pushToast("Action failed", "error");
    }
  }

  return (
    <div className="page-stack">
      <div className="kpi-grid">
        <Card>
          <div className="kpi-label">Total Incidents</div>
          <div className="kpi-value">{summary.total}</div>
        </Card>
        <Card>
          <div className="kpi-label">Pending Review</div>
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
            <h2>Events</h2>
            <p>Filter, review and acknowledge incident stream.</p>
          </div>
          {mode === "admin" && (
            <Button
              variant="secondary"
              onClick={() =>
                downloadEventsCsv({
                  cameraId: filters.camera_id,
                  status: filters.status,
                  from: filters.from,
                  to: filters.to
                })
              }
            >
              Export
            </Button>
          )}
        </div>

        <div className="filter-bar">
          <input
            className="ui-input"
            type="datetime-local"
            value={filters.from}
            onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))}
          />
          <input
            className="ui-input"
            type="datetime-local"
            value={filters.to}
            onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))}
          />
          <select
            className="ui-input"
            value={filters.camera_id}
            onChange={(e) => setFilters((p) => ({ ...p, camera_id: e.target.value }))}
          >
            <option value="">All Cameras</option>
            {cameras.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name || `Camera ${c.id}`}
              </option>
            ))}
          </select>
          <select
            className="ui-input"
            value={filters.status}
            onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
          >
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="acknowledged">Acknowledged</option>
          </select>
          <Button onClick={() => loadEvents({ silent: true })}>Apply</Button>
        </div>

        <DataTable
          columns={columns}
          loading={loading || refreshing}
          emptyText="No incidents found"
          rowsCount={events.length}
        >
          {events.map((e) => {
            const severity = getSeverity(e.confidence);
            return (
              <tr key={e.id} className={newRowIds.has(e.id) ? "row-flash" : ""}>
                <td>#{e.id}</td>
                <td>{cameraName(e.camera_id)}</td>
                <td>{formatVNTime(e.ts)}</td>
                <td>
                  <Badge tone={severityTone(severity)} pulse={severity === "critical"}>
                    {severity}
                  </Badge>
                </td>
                <td>{Number(e.confidence || 0).toFixed(2)}</td>
                <td>
                  <Badge tone={statusTone(e)}>{e.ack ? "ACK" : "NEW"}</Badge>
                </td>
                <td>
                  <Link className="link-inline" to={`/${mode === "admin" ? "admin" : "app"}/events/${e.id}`}>
                    View
                  </Link>
                </td>
                <td>
                  {!e.ack ? (
                    <Button variant="secondary" className="ack-btn" onClick={() => setConfirm(e)}>
                      Ack / Resolve
                    </Button>
                  ) : (
                    <span className="muted-text">{e.ack_by || "reviewed"}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </DataTable>
      </Card>

      <Modal
        open={Boolean(confirm)}
        title="Confirm action"
        onClose={() => setConfirm(null)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (confirm) {
                  await ackEvent(confirm.id);
                }
                setConfirm(null);
              }}
            >
              Confirm
            </Button>
          </>
        }
      >
        {confirm && (
          <p>
            Mark incident #{confirm.id} as acknowledged/resolved?
          </p>
        )}
      </Modal>
    </div>
  );
}
