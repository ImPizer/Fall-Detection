import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.config import Settings


router = APIRouter()
cfg = Settings()


@router.get("/clips/{filename}")
def get_clip(filename: str):
    for base in (cfg.snapshots_dir, cfg.clips_dir):
        path = os.path.join(base, filename)
        if os.path.exists(path):
            return FileResponse(path)
    raise HTTPException(status_code=404, detail="Not found")
