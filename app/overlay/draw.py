import cv2


def draw_bbox(frame, bbox, color=(0, 255, 0), thickness=2):
    if not bbox:
        return
    x1, y1, x2, y2 = bbox
    cv2.rectangle(frame, (x1, y1), (x2, y2), color, thickness)


def draw_pose(pose, frame, bbox, landmarks):
    if not (bbox and landmarks):
        return
    x1, y1, x2, y2 = bbox
    pose.mp_draw.draw_landmarks(
        frame[y1:y2, x1:x2],
        landmarks,
        pose.mp_pose.POSE_CONNECTIONS,
    )


def draw_status(frame, status: str, counter: int, ratio: float, system_time: str):
    color = (0, 0, 255) if status == "FALL" else (0, 255, 0)
    cv2.putText(frame, status, (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 1.2, color, 3)
    cv2.putText(
        frame,
        f"counter={counter}",
        (20, 80),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (255, 200, 200),
        2,
    )
    cv2.putText(
        frame,
        f"ratio={ratio:.2f}",
        (20, 110),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (255, 255, 0),
        2,
    )
    cv2.putText(
        frame,
        system_time,
        (20, 140),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (200, 255, 200),
        2,
    )

