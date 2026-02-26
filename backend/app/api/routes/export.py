import csv
import io
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.db import models
from app.deps import get_db, require_admin


router = APIRouter()


@router.get("/export", dependencies=[Depends(require_admin)])
def export_events(
    cameraId: int | None = None,
    status: str | None = None,
    from_ts: str | None = Query(default=None, alias="from"),
    to_ts: str | None = Query(default=None, alias="to"),
    db: Session = Depends(get_db),
):
    q = db.query(models.Event)
    if cameraId is not None:
        q = q.filter(models.Event.camera_id == cameraId)
    if status:
        if status == "new":
            q = q.filter(models.Event.ack.is_(False))
        elif status in ("ack", "acknowledged"):
            q = q.filter(models.Event.ack.is_(True))
    if from_ts:
        q = q.filter(models.Event.ts >= datetime.fromisoformat(from_ts))
    if to_ts:
        q = q.filter(models.Event.ts <= datetime.fromisoformat(to_ts))

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "user_id", "camera_id", "ts", "confidence", "severity", "ack", "ack_by"])
    for ev in q.order_by(models.Event.ts.desc()).all():
        writer.writerow([ev.id, ev.user_id, ev.camera_id, ev.ts, ev.confidence, ev.severity, ev.ack, ev.ack_by])

    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=events.csv"},
    )
