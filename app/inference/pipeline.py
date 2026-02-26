import cv2


class InferencePipeline:
    def __init__(self, detector, pose, pose_y_diff: float) -> None:
        self.detector = detector
        self.pose = pose
        self.pose_y_diff = pose_y_diff

    def run(self, frame):
        results = self.detector.infer(frame)
        ratio = 0
        is_pose_fall = False
        bbox = None
        landmarks = None

        if len(results.boxes) > 0:
            best_box = max(
                results.boxes,
                key=lambda b: (b.xyxy[0][2] - b.xyxy[0][0])
                * (b.xyxy[0][3] - b.xyxy[0][1]),
            )
            x1, y1, x2, y2 = map(int, best_box.xyxy[0])
            bbox = (x1, y1, x2, y2)

            w_box = x2 - x1
            h_box = y2 - y1
            ratio = w_box / max(h_box, 1)

            crop = frame[y1:y2, x1:x2]
            if crop.size > 0:
                rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
                pose_result = self.pose.process(rgb)
                if pose_result.pose_landmarks:
                    landmarks = pose_result.pose_landmarks

                    lm = pose_result.pose_landmarks.landmark
                    ls = lm[self.pose.mp_pose.PoseLandmark.LEFT_SHOULDER]
                    rs = lm[self.pose.mp_pose.PoseLandmark.RIGHT_SHOULDER]
                    lh = lm[self.pose.mp_pose.PoseLandmark.LEFT_HIP]
                    rh = lm[self.pose.mp_pose.PoseLandmark.RIGHT_HIP]

                    shoulder_y = (ls.y + rs.y) / 2
                    hip_y = (lh.y + rh.y) / 2

                    if shoulder_y > hip_y - self.pose_y_diff:
                        is_pose_fall = True

        return {
            "ratio": ratio,
            "is_pose_fall": is_pose_fall,
            "bbox": bbox,
            "landmarks": landmarks,
        }

