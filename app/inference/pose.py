import mediapipe as mp


class PoseEstimator:
    def __init__(
        self,
        min_detection_confidence: float = 0.5,
        min_tracking_confidence: float = 0.5,
    ) -> None:
        self.mp_pose = mp.solutions.pose
        self.mp_draw = mp.solutions.drawing_utils
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
        )

    def process(self, rgb_frame):
        return self.pose.process(rgb_frame)

    def draw(self, frame, pose_landmarks, offset=(0, 0)):
        x, y = offset
        self.mp_draw.draw_landmarks(
            frame[y:, x:],
            pose_landmarks,
            self.mp_pose.POSE_CONNECTIONS,
        )

