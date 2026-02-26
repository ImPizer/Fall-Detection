from dataclasses import dataclass
from datetime import datetime


@dataclass
class EventState:
    prev_fall: bool = False
    recording: bool = False
    after_count: int = 0
    ts: str = ""


class FallEventHandler:
    def __init__(self, save_after: int) -> None:
        self.save_after = save_after
        self.state = EventState()

    def should_start_event(self, fall_detected: bool) -> bool:
        return fall_detected and not self.state.prev_fall

    def start_event(self) -> str:
        self.state.ts = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        self.state.recording = True
        self.state.after_count = 0
        return self.state.ts

    def update_recording(self) -> bool:
        if not self.state.recording:
            return False
        self.state.after_count += 1
        if self.state.after_count >= self.save_after:
            self.state.recording = False
            return True
        return False

    def set_prev(self, fall_detected: bool) -> None:
        self.state.prev_fall = fall_detected

