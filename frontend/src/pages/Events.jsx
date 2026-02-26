import React, { useCallback, useEffect, useState } from "react";
import { apiFetch, downloadEventsCsv } from "../services/api.js";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getSeverity, severityClass, statusClass, statusLabel } from "../services/eventUtils.js";
import useEventStream from "../hooks/useEventStream.js";
import { formatVNTime } from "../services/time.js";

export default function Events({ mode = "user" }) {
  const auth = useAuth();
  const [events, setEvents] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newRowIds, setNewRowIds] = useState(() => new Set());
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    camera_id: "",
    status: ""
  });

  async function loadEvents() {
    setIsRefreshing(true);
    const query = new URLSearchParams();
    if (filters.from) query.set("from", filters.from);
    if (filters.to) query.set("to", filters.to);
    if (filters.camera_id) query.set("cameraId", filters.camera_id);
    if (filters.status) query.set("status", filters.status);
    const qs = query.toString() ? `?${query.toString()}` : "";
    try {
      const data = await apiFetch(`/events${qs}`);
      setEvents(data);
    } finally {
      window.setTimeout(() => setIsRefreshing(false), 180);
    }
  }

  useEffect(() => {
    loadEvents().catch(() => setEvents([]));
    apiFetch("/cameras").then(setCameras).catch(() => setCameras([]));
  }, []);

  const onStreamEvent = useCallback((incoming) => {
    setEvents((prev) => {
      const exists = prev.some((e) => e.id === incoming.event_id);
      if (exists) return prev;
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
      ];
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
      }, 1400);
      return next.slice(0, 200);
    });
  }, []);

  useEventStream(onStreamEvent);

  function cameraName(cameraId) {
    const cam = cameras.find((c) => c.id === cameraId);
    return cam ? cam.name : cameraId ? `Camera ${cameraId}` : "Unknown";
  }

  async function onAck(id) {
    await apiFetch(`/events/${id}/ack`, {
      method: "PATCH",
      body: JSON.stringify({ ack_by: auth.user })
    });
    await loadEvents();
  }

  function handleAckClick(e, id) {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.left = `${e.clientX - rect.left}px`;
    ripple.style.top = `${e.clientY - rect.top}px`;
    button.appendChild(ripple);
    window.setTimeout(() => ripple.remove(), 320);
    onAck(id);
  }

  function onFilterChange(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="card">
      <div className="header">
        <h2>Events</h2>
        {mode === "admin" && (
          <button
            className="btn secondary"
            onClick={() =>
              downloadEventsCsv({
                cameraId: filters.camera_id,
                status: filters.status,
                from: filters.from,
                to: filters.to
              })
            }
          >
            Export CSV
          </button>
        )}
      </div>
      <div className="filters">
        <input
          className="input"
          type="datetime-local"
          value={filters.from}
          onChange={(e) => onFilterChange("from", e.target.value)}
        />
        <input
          className="input"
          type="datetime-local"
          value={filters.to}
          onChange={(e) => onFilterChange("to", e.target.value)}
        />
        <select
          className="input"
          value={filters.camera_id}
          onChange={(e) => onFilterChange("camera_id", e.target.value)}
        >
          <option value="">All Cameras</option>
          {cameras.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name || `Camera ${c.id}`}
            </option>
          ))}
        </select>
        <select
          className="input"
          value={filters.status}
          onChange={(e) => onFilterChange("status", e.target.value)}
        >
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="acknowledged">Acknowledged</option>
        </select>
        <button className="btn" onClick={() => loadEvents()}>
          Apply
        </button>
      </div>
      <div className={`table-shell ${isRefreshing ? "is-refreshing" : ""}`}>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Camera Source</th>
            <th>Time</th>
            <th>Severity</th>
            <th>Confidence</th>
            <th>Status</th>
            <th>Detail</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id} className={newRowIds.has(e.id) ? "row-new-once" : ""}>
              <td>{e.id}</td>
              <td>{cameraName(e.camera_id)}</td>
              <td>{formatVNTime(e.ts)}</td>
              <td>
                <span
                  className={`${severityClass(getSeverity(e.confidence))} ${
                    getSeverity(e.confidence) === "critical" ? "pulse-critical" : ""
                  }`}
                >
                  {getSeverity(e.confidence)}
                </span>
              </td>
              <td>{e.confidence}</td>
              <td>
                <span className={statusClass(e)}>{statusLabel(e)}</span>
              </td>
              <td>
                <Link to={`/${mode === "admin" ? "admin" : "app"}/events/${e.id}`}>View</Link>
              </td>
              <td>
                {!e.ack ? (
                  <button className="btn secondary ack-btn" onClick={(evt) => handleAckClick(evt, e.id)}>
                    Ack
                  </button>
                ) : (
                  "-"
                )}
              </td>
            </tr>
          ))}
          {events.length === 0 && (
            <tr>
              <td colSpan="8">No events found.</td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}
