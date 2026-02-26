from dataclasses import dataclass


@dataclass
class FallConfig:
    fall_window: int
    aspect_ratio_thres: float
    pose_y_diff: float


class FallDetector:
    def __init__(self, cfg: FallConfig) -> None:
        self.cfg = cfg
        self.fall_counter = 0
        self.prev_fall = False

    def reset(self) -> None:
        self.fall_counter = 0
        self.prev_fall = False

    def update(self, ratio: float, is_pose_fall: bool) -> bool:
        if ratio > self.cfg.aspect_ratio_thres or is_pose_fall:
            self.fall_counter += 1
        else:
            self.fall_counter = max(self.fall_counter - 1, 0)

        fall_detected = self.fall_counter >= self.cfg.fall_window
        return fall_detected

