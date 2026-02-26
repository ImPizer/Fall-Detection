from app.recording.buffer import FrameBuffer
from app.recording.clipper import save_video


class PrePostRecorder:
    def __init__(self, save_before: int):
        self.buffer = FrameBuffer(save_before)
        self.record_frames = []

    def push(self, frame) -> None:
        self.buffer.append(frame)

    def start(self) -> None:
        self.record_frames = self.buffer.snapshot()

    def append(self, frame) -> None:
        self.record_frames.append(frame.copy())

    def save(self, path: str, fps: float, size: tuple[int, int]) -> None:
        save_video(path, self.record_frames, fps, size)
