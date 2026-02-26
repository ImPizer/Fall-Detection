from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import requests

from app.config import Settings


class DiscordNotifier:
    def __init__(self, cfg: Settings) -> None:
        self.cfg = cfg
        self.enabled = (
            cfg.discord_notify_enabled
            and bool(cfg.discord_bot_token.strip())
            and bool(cfg.discord_channel_id.strip())
        )

    def _format_time(self, ts: datetime) -> str:
        base = ts if ts.tzinfo is not None else ts.replace(tzinfo=timezone.utc)
        try:
            zone = ZoneInfo(self.cfg.discord_timezone)
        except ZoneInfoNotFoundError:
            zone = timezone.utc
        local = base.astimezone(zone)
        return local.strftime("%Y-%m-%d %H:%M:%S")

    def notify_fall_event(
        self,
        *,
        event_id: int,
        camera_name: str | None,
        ts: datetime,
        severity: str,
        confidence: float,
        snapshot_file_path: str | None,
        clip_file_path: str | None,
        snapshot_url: str | None,
        clip_url: str | None,
    ) -> None:
        if not self.enabled:
            return

        lines = [
            ":rotating_light: **FALL ALERT**",
            f"Event ID: `{event_id}`",
            f"Camera: `{camera_name or 'Unknown'}`",
            f"Time: `{self._format_time(ts)}`",
            f"Severity: `{severity}`",
            f"Confidence: `{confidence:.2f}`",
        ]
        max_bytes = max(self.cfg.discord_max_file_mb, 1) * 1024 * 1024
        media_files: list[tuple[str, str]] = []
        link_fallbacks: list[str] = []

        if self.cfg.discord_attach_media and snapshot_file_path:
            if os.path.exists(snapshot_file_path) and os.path.getsize(snapshot_file_path) <= max_bytes:
                media_files.append(("image", snapshot_file_path))
            elif snapshot_url:
                link_fallbacks.append(f"Image: {snapshot_url}")

        if self.cfg.discord_attach_media and clip_file_path:
            if os.path.exists(clip_file_path) and os.path.getsize(clip_file_path) <= max_bytes:
                media_files.append(("video", clip_file_path))
            elif clip_url:
                link_fallbacks.append(f"Video: {clip_url}")

        if not media_files:
            if snapshot_url:
                link_fallbacks.append(f"Image: {snapshot_url}")
            if clip_url:
                link_fallbacks.append(f"Video: {clip_url}")

        lines.extend(link_fallbacks)
        content = "\n".join(lines)
        headers = {"Authorization": f"Bot {self.cfg.discord_bot_token}"}
        url = (
            f"{self.cfg.discord_api_base.rstrip('/')}/channels/"
            f"{self.cfg.discord_channel_id}/messages"
        )

        if media_files:
            payload_json = {"content": content}
            data = {"payload_json": json.dumps(payload_json)}
            open_files = []
            files_payload = []
            try:
                for idx, (_, path) in enumerate(media_files):
                    file_obj = open(path, "rb")
                    open_files.append(file_obj)
                    filename = os.path.basename(path)
                    files_payload.append((f"files[{idx}]", (filename, file_obj)))
                resp = requests.post(url, data=data, files=files_payload, headers=headers, timeout=15)
                if self.cfg.discord_log_errors and resp.status_code >= 300:
                    print(
                        f"[discord] media send failed status={resp.status_code} "
                        f"body={resp.text[:300]}"
                    )
                return
            except requests.RequestException as exc:
                if self.cfg.discord_log_errors:
                    print(f"[discord] media send exception: {exc}")
            finally:
                for f in open_files:
                    f.close()

        try:
            resp = requests.post(url, json={"content": content}, headers=headers, timeout=6)
            if self.cfg.discord_log_errors and resp.status_code >= 300:
                print(
                    f"[discord] send failed status={resp.status_code} "
                    f"body={resp.text[:300]}"
                )
        except requests.RequestException as exc:
            # Event ingest must stay successful even if Discord send fails.
            if self.cfg.discord_log_errors:
                print(f"[discord] send exception: {exc}")
