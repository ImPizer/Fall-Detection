import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text

from app.config import Settings
from app.db.session import Base, engine, SessionLocal
from app.db import models
from app.auth import hash_password
from app.runtime.realtime_process import RealtimeProcess
from app.api.routes import health, auth, cameras, events, clips, settings, export, ingest, users
from app.api import ws as ws_routes


cfg = Settings()
Base.metadata.create_all(bind=engine)
backend_dir = Path(__file__).resolve().parents[1]
frontend_dist = Path(cfg.frontend_dist)
if not frontend_dist.is_absolute():
    frontend_dist = (backend_dir / frontend_dist).resolve()

os.makedirs(cfg.snapshots_dir, exist_ok=True)
os.makedirs(cfg.clips_dir, exist_ok=True)


def apply_runtime_migrations():
    inspector = inspect(engine)
    with engine.begin() as conn:
        user_cols = {c["name"] for c in inspector.get_columns("users")}
        if "enabled" not in user_cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN enabled BOOLEAN DEFAULT 1"))

        camera_cols = {c["name"] for c in inspector.get_columns("cameras")}
        if "owner_user_id" not in camera_cols:
            conn.execute(text("ALTER TABLE cameras ADD COLUMN owner_user_id INTEGER"))

        event_cols = {c["name"] for c in inspector.get_columns("events")}
        if "user_id" not in event_cols:
            conn.execute(text("ALTER TABLE events ADD COLUMN user_id INTEGER"))
        if "severity" not in event_cols:
            conn.execute(text("ALTER TABLE events ADD COLUMN severity VARCHAR DEFAULT 'low'"))
        if "meta_json" not in event_cols:
            conn.execute(text("ALTER TABLE events ADD COLUMN meta_json VARCHAR"))


def ensure_admin():
    db = SessionLocal()
    try:
        exists = db.query(models.User).filter(models.User.username == cfg.admin_user).first()
        if not exists:
            user = models.User(
                username=cfg.admin_user,
                password_hash=hash_password(cfg.admin_pass),
                role="admin",
                enabled=True,
            )
            db.add(user)
            db.commit()
    finally:
        db.close()


apply_runtime_migrations()
ensure_admin()

app = FastAPI(title=cfg.app_name)
realtime_proc = RealtimeProcess()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(cameras.router)
app.include_router(events.router)
app.include_router(clips.router)
app.include_router(settings.router)
app.include_router(export.router)
app.include_router(ingest.router)
app.include_router(users.router)
app.include_router(ws_routes.router)

assets_dir = frontend_dist / "assets"
if assets_dir.is_dir():
    app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="frontend-assets")


@app.on_event("startup")
def startup_event():
    if cfg.enable_realtime:
        realtime_proc.start()


@app.on_event("shutdown")
def shutdown_event():
    realtime_proc.stop()


@app.get("/")
def root():
    index_path = frontend_dist / "index.html"
    if index_path.is_file():
        return FileResponse(str(index_path))
    return {"status": "backend-only", "frontend": "build not found"}


@app.get("/{full_path:path}")
def spa_fallback(full_path: str):
    if full_path.startswith(("health", "auth", "users", "cameras", "events", "clips", "settings", "export", "ws")):
        return {"detail": "Not Found"}
    index_path = frontend_dist / "index.html"
    if index_path.is_file():
        return FileResponse(str(index_path))
    return {"status": "backend-only", "frontend": "build not found"}
