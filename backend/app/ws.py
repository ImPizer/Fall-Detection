from typing import List, Dict, Any
from fastapi import WebSocket


class WSManager:
    def __init__(self) -> None:
        self.active: List[Dict[str, Any]] = []

    async def connect(self, ws: WebSocket, user: dict):
        await ws.accept()
        self.active.append({"ws": ws, "user": user})

    def disconnect(self, ws: WebSocket):
        self.active = [conn for conn in self.active if conn["ws"] != ws]

    async def broadcast(self, message: dict):
        stale = []
        for conn in list(self.active):
            ws = conn["ws"]
            user = conn["user"]
            if message.get("type") == "fall_event" and user.get("role") != "admin":
                msg_user_id = message.get("user_id")
                msg_camera_id = message.get("camera_id")
                allowed_camera_ids = set(user.get("allowed_camera_ids", []))
                if msg_user_id == user.get("id"):
                    pass
                elif msg_camera_id in allowed_camera_ids:
                    pass
                else:
                    continue
            try:
                await ws.send_json(message)
            except Exception:
                stale.append(ws)
        for ws in stale:
            self.disconnect(ws)


ws_manager = WSManager()
