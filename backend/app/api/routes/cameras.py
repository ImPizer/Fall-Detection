from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.db import models
from app.deps import get_db, get_current_user, require_admin
from app.schemas import CameraCreate, CameraOut, CameraUpdate


router = APIRouter()


@router.get("/cameras", response_model=list[CameraOut])
def list_cameras(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    q = db.query(models.Camera)
    if current_user.role != "admin":
        q = q.filter(or_(models.Camera.owner_user_id == current_user.id, models.Camera.owner_user_id.is_(None)))
    return q.order_by(models.Camera.id.asc()).all()


@router.post("/cameras", response_model=CameraOut, dependencies=[Depends(require_admin)])
def create_camera(data: CameraCreate, db: Session = Depends(get_db)):
    cam = models.Camera(**data.model_dump())
    db.add(cam)
    db.commit()
    db.refresh(cam)
    return cam


@router.patch("/cameras/{camera_id}", response_model=CameraOut, dependencies=[Depends(require_admin)])
def update_camera(camera_id: int, data: CameraUpdate, db: Session = Depends(get_db)):
    cam = db.query(models.Camera).filter(models.Camera.id == camera_id).first()
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    payload = data.model_dump(exclude_unset=True)
    for key, value in payload.items():
        setattr(cam, key, value)
    db.commit()
    db.refresh(cam)
    return cam


@router.delete("/cameras/{camera_id}", dependencies=[Depends(require_admin)])
def delete_camera(camera_id: int, db: Session = Depends(get_db)):
    cam = db.query(models.Camera).filter(models.Camera.id == camera_id).first()
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    db.query(models.Event).filter(models.Event.camera_id == camera_id).update({"camera_id": None})
    db.delete(cam)
    db.commit()
    return {"status": "ok"}
