from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.db import models
from app.deps import get_db, get_current_user
from app.schemas import EventOut, EventAck
from app.ws import ws_manager


router = APIRouter()


def apply_visibility_filter(q, user, db: Session):
    if user.role == "admin":
        return q
    allowed_camera_ids = (
        db.query(models.Camera.id)
        .filter(
            or_(
                models.Camera.owner_user_id == user.id,
                models.Camera.owner_user_id.is_(None),
            )
        )
        .subquery()
    )
    return q.filter(
        or_(
            models.Event.user_id == user.id,
            models.Event.camera_id.in_(allowed_camera_ids),
        )
    )


def serialize_event(ev: models.Event) -> dict:
    ts = ev.ts
    if ts is not None and ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    return {
        "id": ev.id,
        "user_id": ev.user_id,
        "camera_id": ev.camera_id,
        "ts": ts,
        "confidence": ev.confidence,
        "severity": ev.severity,
        "snapshot_path": ev.snapshot_path,
        "clip_path": ev.clip_path,
        "ack": ev.ack,
        "ack_by": ev.ack_by,
    }


@router.get("/events", response_model=list[EventOut])
def list_events(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    cameraId: int | None = None,
    status: str | None = None,
    from_ts: str | None = Query(default=None, alias="from"),
    to_ts: str | None = Query(default=None, alias="to"),
    page: int = 1,
    limit: int = 50,
):
    q = db.query(models.Event)
    q = apply_visibility_filter(q, current_user, db)
    if status:
        if status == "new":
            q = q.filter(models.Event.ack.is_(False))
        elif status in ("ack", "acknowledged"):
            q = q.filter(models.Event.ack.is_(True))
    if cameraId is not None:
        q = q.filter(models.Event.camera_id == cameraId)
    if from_ts:
        q = q.filter(models.Event.ts >= datetime.fromisoformat(from_ts))
    if to_ts:
        q = q.filter(models.Event.ts <= datetime.fromisoformat(to_ts))

    page = max(page, 1)
    limit = min(max(limit, 1), 200)
    events = q.order_by(models.Event.ts.desc()).offset((page - 1) * limit).limit(limit).all()
    return [serialize_event(ev) for ev in events]


@router.get("/events/{event_id}", response_model=EventOut)
def get_event(event_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    q = db.query(models.Event).filter(models.Event.id == event_id)
    q = apply_visibility_filter(q, current_user, db)
    ev = q.first()
    if not ev:
        raise HTTPException(status_code=404, detail="Not found")
    return serialize_event(ev)


@router.patch("/events/{event_id}/ack")
def ack_event(
    event_id: int,
    data: EventAck,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(models.Event).filter(models.Event.id == event_id)
    q = apply_visibility_filter(q, current_user, db)
    ev = q.first()
    if not ev:
        raise HTTPException(status_code=404, detail="Not found")
    ev.ack = True
    ev.ack_by = data.ack_by or current_user.username
    ev.ack_at = datetime.utcnow()
    db.commit()
    return {"status": "ok"}


@router.post("/events/_notify")
async def notify_event(payload: dict):
    await ws_manager.broadcast(payload)
    return {"status": "ok"}
