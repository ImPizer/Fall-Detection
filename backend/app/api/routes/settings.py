from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import models
from app.deps import get_db, require_admin
from app.schemas import SettingsPayload


router = APIRouter()


DEFAULTS = SettingsPayload().model_dump()


def read_settings(db: Session) -> dict:
    rows = db.query(models.Setting).all()
    raw = {r.key: r.value for r in rows}
    merged = dict(DEFAULTS)
    for key, default_value in DEFAULTS.items():
        value = raw.get(key, default_value)
        if isinstance(default_value, bool):
            merged[key] = str(value).lower() in ("1", "true", "yes")
        elif isinstance(default_value, int):
            merged[key] = int(value)
        elif isinstance(default_value, float):
            merged[key] = float(value)
        else:
            merged[key] = str(value)
    return merged


@router.get("/settings", response_model=SettingsPayload, dependencies=[Depends(require_admin)])
def get_settings(db: Session = Depends(get_db)):
    return SettingsPayload(**read_settings(db))


@router.put("/settings", response_model=SettingsPayload, dependencies=[Depends(require_admin)])
def update_settings(data: SettingsPayload, db: Session = Depends(get_db)):
    payload = data.model_dump()
    for key, value in payload.items():
        row = db.query(models.Setting).filter(models.Setting.key == key).first()
        if not row:
            row = models.Setting(key=key, value=str(value))
            db.add(row)
        else:
            row.value = str(value)
            row.updated_at = datetime.utcnow()
    db.commit()
    return data
