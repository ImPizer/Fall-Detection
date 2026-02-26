from ultralytics import YOLO


class YoloPoseDetector:
    def __init__(self, model_path: str) -> None:
        self.model = YOLO(model_path)

    def infer(self, frame, conf: float = 0.25):
        return self.model(frame, conf=conf)[0]

