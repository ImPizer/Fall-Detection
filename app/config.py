import os
from dataclasses import dataclass


@dataclass
class Settings:
    cam_id: int = int(os.getenv("CAM_ID", "0"))
    video_path: str = os.getenv("VIDEO_PATH", "VideoTest/video4.mp4")
    output_path: str = os.getenv("OUTPUT_PATH", "output_fall.mp4")

    fall_window: int = int(os.getenv("FALL_WINDOW", "8"))
    aspect_ratio_thres: float = float(os.getenv("ASPECT_RATIO_THRES", "1.4"))
    pose_y_diff: float = float(os.getenv("POSE_Y_DIFF", "0.05"))

    save_before: int = int(os.getenv("SAVE_BEFORE", "60"))
    save_after: int = int(os.getenv("SAVE_AFTER", "90"))

    img_dir: str = os.getenv("IMG_DIR", "backend/storage/snapshots")
    vid_dir: str = os.getenv("VID_DIR", "backend/storage/clips")

    model_path: str = os.getenv("MODEL_PATH", "yolov8n-pose.pt")
