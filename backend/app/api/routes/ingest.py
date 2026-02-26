import os
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.config import Settings
from app.db import models
from app.deps import get_db
from app.integrations.discord_notifier import DiscordNotifier
from app.ws import ws_manager


router = APIRouter()
cfg = Settings()
discord_notifier = DiscordNotifier(cfg)


def get_severity(confidence: float) -> str:
    if confidence >= 0.85:
        return "critical"
    if confidence >= 0.65:
        return "high"
    if confidence >= 0.45:
        return "medium"
    return "low"


def parse_ts(value):
    if not value:
        return datetime.now(timezone.utc)
    try:
        dt = datetime.fromisoformat(value)
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except ValueError:
        try:
            return datetime.strptime(value, "%Y-%m-%d_%H-%M-%S").replace(tzinfo=timezone.utc)
        except ValueError:
            return datetime.now(timezone.utc)


def to_public_clip_url(filename: str | None) -> str | None:
    if not filename:
        return None
    return f"{cfg.public_base_url.rstrip('/')}/clips/{filename}"


@router.post("/events/ingest")
async def ingest_event(
    payload: dict,
    db: Session = Depends(get_db),
    x_ingest_key: str | None = Header(default=None),
):
    if x_ingest_key != cfg.ingest_key:
        raise HTTPException(status_code=401, detail="Invalid ingest key")

    snapshot_name = None
    clip_name = None
    if payload.get("snapshot_path"):
        snapshot_name = os.path.basename(payload["snapshot_path"])
    if payload.get("clip_path"):
        clip_name = os.path.basename(payload["clip_path"])

    camera = None
    if payload.get("camera_id") is not None:
        camera = db.query(models.Camera).filter(models.Camera.id == payload["camera_id"]).first()
    if not camera:
        camera = db.query(models.Camera).filter(models.Camera.enabled.is_(True)).order_by(models.Camera.id.asc()).first()
    camera_id = camera.id if camera else payload.get("camera_id")
    if camera and not camera.enabled:
        raise HTTPException(status_code=400, detail="Camera is disabled")
    confidence = float(payload.get("confidence", 0.0))
    severity = payload.get("severity") or get_severity(confidence)

    ev = models.Event(
        user_id=payload.get("user_id") or (camera.owner_user_id if camera else None),
        camera_id=camera_id,
        ts=parse_ts(payload.get("ts")),
        confidence=confidence,
        severity=severity,
        snapshot_path=snapshot_name,
        clip_path=clip_name,
        meta_json=json.dumps(payload.get("meta", {})),
        ack=False,
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)

    snapshot_url = f"/clips/{ev.snapshot_path}" if ev.snapshot_path else None
    clip_url = f"/clips/{ev.clip_path}" if ev.clip_path else None
    snapshot_file_path = os.path.join(cfg.snapshots_dir, ev.snapshot_path) if ev.snapshot_path else None
    clip_file_path = os.path.join(cfg.clips_dir, ev.clip_path) if ev.clip_path else None
    snapshot_public_url = to_public_clip_url(ev.snapshot_path)
    clip_public_url = to_public_clip_url(ev.clip_path)
    await ws_manager.broadcast(
        {
            "type": "fall_event",
            "event_id": ev.id,
            "user_id": ev.user_id,
            "camera_id": ev.camera_id,
            "ts": ev.ts.isoformat(),
            "confidence": ev.confidence,
            "severity": ev.severity,
            "status": "new",
            "snapshot_url": snapshot_url,
            "clip_url": clip_url,
        }
    )

    discord_notifier.notify_fall_event(
        event_id=ev.id,
        camera_name=camera.name if camera else None,
        ts=ev.ts,
        severity=ev.severity,
        confidence=ev.confidence,
        snapshot_file_path=snapshot_file_path,
        clip_file_path=clip_file_path,
        snapshot_url=snapshot_public_url,
        clip_url=clip_public_url,
    )

    return {"status": "ok", "event_id": ev.id, "snapshot_url": snapshot_url, "clip_url": clip_url}
