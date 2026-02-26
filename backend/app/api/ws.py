from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import jwt, JWTError
from sqlalchemy import or_

from app.config import Settings
from app.db.session import SessionLocal
from app.db import models
from app.ws import ws_manager


router = APIRouter()
cfg = Settings()


def resolve_user(token: str):
    db = SessionLocal()
    try:
        payload = jwt.decode(token, cfg.secret_key, algorithms=["HS256"])
        username = payload.get("sub")
        if not username:
            return None
        user = db.query(models.User).filter(models.User.username == username).first()
        if not user or not user.enabled:
            return None
        allowed_camera_ids = []
        if user.role != "admin":
            cams = (
                db.query(models.Camera.id)
                .filter(
                    or_(
                        models.Camera.owner_user_id == user.id,
                        models.Camera.owner_user_id.is_(None),
                    )
                )
                .all()
            )
            allowed_camera_ids = [c.id for c in cams]
        return {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "allowed_camera_ids": allowed_camera_ids,
        }
    except JWTError:
        return None
    finally:
        db.close()


@router.websocket("/ws/events")
async def ws_events(ws: WebSocket):
    token = ws.query_params.get("token", "")
    user = resolve_user(token)
    if not user:
        await ws.close(code=1008)
        return
    await ws_manager.connect(ws, user)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(ws)
