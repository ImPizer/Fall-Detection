from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "user"
    enabled: bool = True


class UserUpdate(BaseModel):
    role: Optional[str] = None
    enabled: Optional[bool] = None
    password: Optional[str] = None


class UserOut(BaseModel):
    id: int
    username: str
    role: str
    enabled: bool

    model_config = ConfigDict(from_attributes=True)


class CameraCreate(BaseModel):
    name: str
    rtsp_url: str
    enabled: bool = True
    owner_user_id: Optional[int] = None


class CameraUpdate(BaseModel):
    name: Optional[str] = None
    rtsp_url: Optional[str] = None
    enabled: Optional[bool] = None
    owner_user_id: Optional[int] = None


class CameraOut(BaseModel):
    id: int
    name: str
    rtsp_url: str
    enabled: bool
    owner_user_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class EventOut(BaseModel):
    id: int
    user_id: Optional[int]
    camera_id: Optional[int]
    ts: datetime
    confidence: float
    severity: str
    snapshot_path: Optional[str]
    clip_path: Optional[str]
    ack: bool
    ack_by: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class EventAck(BaseModel):
    ack_by: str | None = None


class SettingsPayload(BaseModel):
    confThres: float = Field(0.25, ge=0.05, le=1.0)
    fallWindow: int = Field(8, ge=1, le=60)
    aspectRatioThres: float = Field(1.4, ge=0.5, le=5.0)
    poseYDiff: float = Field(0.05, ge=0.0, le=1.0)
    preBufferSec: int = Field(2, ge=0, le=30)
    postBufferSec: int = Field(3, ge=0, le=30)
    cooldownSec: int = Field(5, ge=0, le=120)
    storageDays: int = Field(7, ge=1, le=365)
    notifyEnabled: bool = True
    notifyChannels: str = "in-app"


class EventQuery(BaseModel):
    cameraId: Optional[int] = None
    status: Optional[str] = None
    from_ts: Optional[str] = None
    to_ts: Optional[str] = None
    page: int = 1
    limit: int = 50
