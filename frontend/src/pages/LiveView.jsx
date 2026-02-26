import React, { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch, fileUrl } from "../services/api.js";
import { getSeverity, severityClass } from "../services/eventUtils.js";
import useEventStream from "../hooks/useEventStream.js";
import { formatVNTime } from "../services/time.js";

export default function LiveView() {
  const [events, setEvents] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [cameraId, setCameraId] = useState("");

  useEffect(() => {
    apiFetch("/cameras").then(setCameras).catch(() => setCameras([]));
    apiFetch("/events?limit=20")
      .then((data) =>
        setEvents(
          data.map((e) => ({
            event_id: e.id,
            camera_id: e.camera_id,
            ts: e.ts,
            confidence: e.confidence,
            severity: e.severity,
            snapshot_url: e.snapshot_path ? `/clips/${e.snapshot_path}` : "",
            clip_url: e.clip_path ? `/clips/${e.clip_path}` : ""
          }))
        )
      )
      .catch(() => setEvents([]));
  }, []);

  const onStreamEvent = useCallback((data) => {
    setEvents((prev) => [data, ...prev].slice(0, 20));
  }, []);

  useEventStream(onStreamEvent);

  const filteredEvents = useMemo(() => {
    if (!cameraId) return events;
    return events.filter((e) => String(e.camera_id) === String(cameraId));
  }, [events, cameraId]);

  const latest = filteredEvents[0];

  return (
    <div className="card">
      <div className="header">
        <h2>Live View</h2>
        <span className="badge">Realtime</span>
      </div>
      <div className="filters" style={{ gridTemplateColumns: "280px 1fr" }}>
        <select className="input" value={cameraId} onChange={(e) => setCameraId(e.target.value)}>
          <option value="">All Cameras</option>
          {cameras.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name || `Camera ${c.id}`}
            </option>
          ))}
        </select>
        <div className="badge">
          {latest ? `Latest incident at ${formatVNTime(latest.ts)}` : "No incidents yet"}
        </div>
      </div>
      <p style={{ color: "var(--muted)" }}>
        Fallback mode displays latest incident snapshot by camera source.
      </p>
      {latest?.snapshot_url && (
        <div className="card">
          <div className="header">
            <div>Latest Snapshot</div>
            <span className={severityClass(getSeverity(latest.confidence))}>
              {getSeverity(latest.confidence)}
            </span>
          </div>
          <img
            src={fileUrl(latest.snapshot_url)}
            alt="latest snapshot"
            style={{ width: "100%", borderRadius: 12, marginTop: 10, maxHeight: 360, objectFit: "cover" }}
          />
        </div>
      )}
      <div className="grid">
        {filteredEvents.length === 0 && <div>No realtime events yet.</div>}
        {filteredEvents.slice(0, 5).map((e) => (
          <div className="card" key={e.event_id}>
            <div className="header">
              <div className="status danger">FALL DETECTED</div>
              <span className={severityClass(getSeverity(e.confidence))}>
                {getSeverity(e.confidence)}
              </span>
            </div>
            <div>Event ID: {e.event_id}</div>
            <div>Camera: {e.camera_id}</div>
            <div>Time: {formatVNTime(e.ts)}</div>
            <div>Confidence: {e.confidence}</div>
            {e.snapshot_url && (
              <img
                src={fileUrl(e.snapshot_url)}
                alt="snapshot"
                style={{ width: "100%", borderRadius: 12, marginTop: 8 }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
