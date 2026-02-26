import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch, fileUrl } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { getSeverity, severityClass, statusClass, statusLabel } from "../services/eventUtils.js";
import { formatVNTime } from "../services/time.js";

export default function EventDetail({ mode = "user" }) {
  const auth = useAuth();
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videoError, setVideoError] = useState("");

  async function loadEvent() {
    setLoading(true);
    try {
      const data = await apiFetch(`/events/${id}`);
      setEvent(data);
    } catch {
      setEvent(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvent();
  }, [id]);

  async function onAck() {
    await apiFetch(`/events/${id}/ack`, {
      method: "PATCH",
      body: JSON.stringify({ ack_by: auth.user })
    });
    await loadEvent();
  }

  if (loading) return <div className="card">Loading...</div>;
  if (!event) return <div className="card">Event not found.</div>;

  return (
    <div className="card">
      <div className="header">
        <h2>Incident #{event.id}</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <span className={severityClass(getSeverity(event.confidence))}>
            {getSeverity(event.confidence)}
          </span>
          <span className={statusClass(event)}>{statusLabel(event)}</span>
        </div>
      </div>
      <div className="grid cols-2">
        <div>
          <div className="meta-row">Camera source: {event.camera_id}</div>
          <div className="meta-row">Detected time: {formatVNTime(event.ts)}</div>
          <div className="meta-row">Confidence: {event.confidence}</div>
          <div className="meta-row">Workflow status: {statusLabel(event)}</div>
          <div style={{ marginTop: 12 }}>
            {!event.ack ? (
              <button className="btn" onClick={onAck}>
                Mark as Acknowledged
              </button>
            ) : (
              <span className="badge">Acknowledged by {event.ack_by || "unknown"}</span>
            )}
          </div>
        </div>
        <div>
          <div className="badge">Snapshot</div>
          {event.snapshot_path && (
            <img
              src={fileUrl(event.snapshot_path)}
              alt="snapshot"
              style={{ width: "100%", borderRadius: 12, marginTop: 8 }}
            />
          )}
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <div className="badge">Evidence Clip</div>
        {event.clip_path && (
          <>
            <video
              controls
              style={{ width: "100%", borderRadius: 12, marginTop: 8 }}
              src={fileUrl(event.clip_path)}
              onError={() => setVideoError("Video preview failed. Try opening or downloading the clip file.")}
            />
            {videoError && (
              <div style={{ marginTop: 8, color: "var(--warn)" }}>
                {videoError}{" "}
                <a href={fileUrl(event.clip_path)} target="_blank" rel="noreferrer">
                  Open clip
                </a>
              </div>
            )}
          </>
        )}
      </div>
      <div className="card timeline-card" style={{ marginTop: 16 }}>
        <div className="timeline-title">Incident Timeline</div>
        <div className="timeline-item">
          <div className="timeline-dot"></div>
          <div>Fall detected at {formatVNTime(event.ts)}</div>
        </div>
        <div className="timeline-item">
          <div className="timeline-dot"></div>
          <div>Snapshot and video evidence recorded</div>
        </div>
        <div className="timeline-item">
          <div className="timeline-dot"></div>
          <div>
            Review status:{" "}
            {event.ack ? `Acknowledged by ${event.ack_by || "reviewer"}` : "Pending review"}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <a className="btn secondary" href={`/${mode === "admin" ? "admin" : "app"}/events`}>
          Back to Events
        </a>
      </div>
    </div>
  );
}
