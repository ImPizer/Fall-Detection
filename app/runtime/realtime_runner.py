import os
import cv2
from datetime import datetime, timezone

from app.config import Settings
from app.events.handler import FallEventHandler
from app.integration.backend_client import BackendClient
from app.inference.detector import YoloPoseDetector
from app.inference.pose import PoseEstimator
from app.inference.pipeline import InferencePipeline
from app.logic.fall_logic import FallConfig, FallDetector
from app.overlay.draw import draw_bbox, draw_pose, draw_status
from app.recording.clipper import ensure_dirs, save_image
from app.recording.recorder import PrePostRecorder
from app.video.capture import VideoCapture


def run_realtime():
    cfg = Settings()
    ensure_dirs(cfg.img_dir, cfg.vid_dir)

    detector = YoloPoseDetector(cfg.model_path)
    pose = PoseEstimator()
    pipeline = InferencePipeline(detector, pose, cfg.pose_y_diff)
    fall = FallDetector(
        FallConfig(
            fall_window=cfg.fall_window,
            aspect_ratio_thres=cfg.aspect_ratio_thres,
            pose_y_diff=cfg.pose_y_diff,
        )
    )
    recorder = PrePostRecorder(cfg.save_before)
    events = FallEventHandler(cfg.save_after)
    backend = BackendClient()

    cap = VideoCapture(cfg.cam_id)
    fps = cap.fps()
    w, h = cap.size()

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        recorder.push(frame)

        result = pipeline.run(frame)
        fall_detected = fall.update(result["ratio"], result["is_pose_fall"])

        draw_bbox(frame, result["bbox"])
        draw_pose(pose, frame, result["bbox"], result["landmarks"])

        status = "FALL" if fall_detected else "NORMAL"
        system_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        draw_status(frame, status, fall.fall_counter, result["ratio"], system_time)

        if events.should_start_event(fall_detected):
            ts = events.start_event()
            img_path = os.path.join(cfg.img_dir, f"fall_{ts}.jpg")
            save_image(img_path, frame)
            recorder.start()

        if events.state.recording:
            recorder.append(frame)
            if events.update_recording():
                vid_path = os.path.join(cfg.vid_dir, f"fall_{events.state.ts}.mp4")
                recorder.save(vid_path, fps, (w, h))
                confidence = min(1.0, fall.fall_counter / max(cfg.fall_window, 1))
                backend.ingest_event(
                    {
                        "camera_id": cfg.cam_id,
                        "ts": datetime.now(timezone.utc).isoformat(),
                        "confidence": confidence,
                        "snapshot_path": img_path,
                        "clip_path": vid_path,
                        "meta": {"ratio": result["ratio"], "counter": fall.fall_counter},
                    }
                )

        events.set_prev(fall_detected)

        cv2.imshow("Realtime Fall Detection", frame)
        if cv2.waitKey(1) == 27:
            break

    cap.release()
    cv2.destroyAllWindows()
