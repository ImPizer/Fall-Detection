import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Card from "../../components/ui/Card.jsx";
import Modal from "../../components/ui/Modal.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { apiFetch, fileUrl } from "../../services/api.js";
import { formatVNTime } from "../../services/time.js";
import { getSeverity } from "../../services/eventUtils.js";

function toneFromSeverity(severity) {
  if (severity === "critical") return "critical";
  if (severity === "high") return "high";
  if (severity === "medium") return "medium";
  return "low";
}

export default function EventDetailPage({ mode = "admin" }) {
  const auth = useAuth();
  const { pushToast } = useToast();
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ackModalOpen, setAckModalOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch(`/events/${id}`);
      setEvent(data);
    } catch {
      setEvent(null);
      pushToast("Unable to load incident", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => null);
  }, [id]);

  async function onAck() {
    if (!event) return;
    try {
      await apiFetch(`/events/${id}/ack`, {
        method: "PATCH",
        body: JSON.stringify({ ack_by: auth.user })
      });
      pushToast("Incident updated", "success");
      setAckModalOpen(false);
      await load();
    } catch {
      pushToast("Action failed", "error");
    }
  }

  if (loading) {
    return <Card>Loading incident detail...</Card>;
  }

  if (!event) {
    return <Card>Incident not found.</Card>;
  }

  const severity = getSeverity(event.confidence);

  return (
    <div className="page-stack">
      <Card>
        <div className="section-head">
          <div>
            <h2>Incident #{event.id}</h2>
            <p>Evidence, metadata and review action.</p>
          </div>
          <div className="inline-actions">
            <Badge tone={toneFromSeverity(severity)} pulse={severity === "critical"}>
              {severity}
            </Badge>
            <Badge tone={event.ack ? "ack" : "new"}>{event.ack ? "ACK" : "NEW"}</Badge>
          </div>
        </div>

        <div className="detail-grid">
          <Card className="sub-card">
            <div className="meta-item"><span>Camera</span><strong>{event.camera_id || "-"}</strong></div>
            <div className="meta-item"><span>Detected</span><strong>{formatVNTime(event.ts)}</strong></div>
            <div className="meta-item"><span>Confidence</span><strong>{Number(event.confidence || 0).toFixed(2)}</strong></div>
            <div className="meta-item"><span>Status</span><strong>{event.ack ? "Acknowledged" : "New"}</strong></div>
            {!event.ack ? (
              <Button onClick={() => setAckModalOpen(true)}>Ack / Resolve</Button>
            ) : (
              <div className="muted-text">Acknowledged by {event.ack_by || "reviewer"}</div>
            )}
          </Card>

          <Card className="sub-card">
            <div className="media-title">Snapshot</div>
            {event.snapshot_path ? (
              <img className="media-preview" src={fileUrl(event.snapshot_path)} alt="snapshot" />
            ) : (
              <div className="empty-panel">No snapshot available</div>
            )}
          </Card>
        </div>
      </Card>

      <Card>
        <div className="section-head">
          <h3>Video Evidence</h3>
        </div>
        {event.clip_path ? (
          <video className="media-video" controls src={fileUrl(event.clip_path)} />
        ) : (
          <div className="empty-panel">No clip available</div>
        )}
      </Card>

      <Card>
        <div className="section-head">
          <h3>Timeline</h3>
        </div>
        <ul className="timeline-list clean">
          <li>Detection captured at {formatVNTime(event.ts)}</li>
          <li>Snapshot and clip archived by recording pipeline</li>
          <li>{event.ack ? `Reviewed by ${event.ack_by || "reviewer"}` : "Awaiting review action"}</li>
        </ul>
      </Card>

      <div>
        <Link className="link-inline" to={`/${mode === "admin" ? "admin" : "app"}/events`}>
          Back to incident list
        </Link>
      </div>

      <Modal
        open={ackModalOpen}
        title="Confirm status change"
        onClose={() => setAckModalOpen(false)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setAckModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onAck}>Confirm</Button>
          </>
        }
      >
        Mark incident #{event.id} as acknowledged/resolved?
      </Modal>
    </div>
  );
}
