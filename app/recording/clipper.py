import os
import cv2


def ensure_dirs(*paths: str) -> None:
    for p in paths:
        os.makedirs(p, exist_ok=True)


def save_image(path: str, frame) -> None:
    cv2.imwrite(path, frame)


def save_video(path: str, frames, fps: float, size: tuple[int, int]) -> None:
    # Prefer H264-compatible codec for browser playback; fallback to mp4v.
    codec_candidates = ["avc1", "H264", "mp4v"]
    out = None
    for codec in codec_candidates:
        writer = cv2.VideoWriter(path, cv2.VideoWriter_fourcc(*codec), fps, size)
        if writer.isOpened():
            out = writer
            break
        writer.release()
    if out is None:
        raise RuntimeError("Cannot initialize video writer")
    for f in frames:
        out.write(f)
    out.release()
