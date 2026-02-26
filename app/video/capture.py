import cv2


class VideoCapture:
    def __init__(self, cam_id: int) -> None:
        self.cap = cv2.VideoCapture(cam_id)
        if not self.cap.isOpened():
            raise RuntimeError("Cannot open webcam")

    def fps(self) -> float:
        return self.cap.get(cv2.CAP_PROP_FPS) or 30

    def size(self) -> tuple[int, int]:
        w = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        h = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        return w, h

    def read(self):
        return self.cap.read()

    def release(self) -> None:
        self.cap.release()

