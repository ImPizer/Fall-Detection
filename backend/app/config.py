import os
from dataclasses import dataclass
from pathlib import Path


def _load_env_file() -> None:
    # Load local env files for standalone runs (without shell-level exports).
    backend_dir = Path(__file__).resolve().parents[1]
    for filename in (".env", ".env.example"):
        env_path = backend_dir / filename
        if not env_path.exists():
            continue
        for raw in env_path.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value
        break


_load_env_file()


@dataclass
class Settings:
    app_name: str = os.getenv("APP_NAME", "Fall Detection API")
    env: str = os.getenv("APP_ENV", "dev")
    secret_key: str = os.getenv("SECRET_KEY", "change-me")
    access_token_exp_minutes: int = int(os.getenv("ACCESS_TOKEN_EXP_MINUTES", "60"))

    db_url: str = os.getenv("DATABASE_URL", "sqlite:///./fall.db")

    storage_root: str = os.getenv("STORAGE_ROOT", "storage")
    snapshots_dir: str = os.getenv("SNAPSHOTS_DIR", "storage/snapshots")
    clips_dir: str = os.getenv("CLIPS_DIR", "storage/clips")

    admin_user: str = os.getenv("ADMIN_USER", "admin")
    admin_pass: str = os.getenv("ADMIN_PASS", "admin123")

    ingest_key: str = os.getenv("INGEST_KEY", "ingest-secret")
    public_base_url: str = os.getenv("PUBLIC_BASE_URL", "http://localhost:8000")
    discord_notify_enabled: bool = os.getenv("DISCORD_NOTIFY_ENABLED", "false").lower() == "true"
    discord_api_base: str = os.getenv("DISCORD_API_BASE", "https://discord.com/api/v10")
    discord_bot_token: str = os.getenv("DISCORD_BOT_TOKEN", "")
    discord_channel_id: str = os.getenv("DISCORD_CHANNEL_ID", "")
    discord_timezone: str = os.getenv("DISCORD_TIMEZONE", "Asia/Ho_Chi_Minh")
    discord_log_errors: bool = os.getenv("DISCORD_LOG_ERRORS", "true").lower() == "true"
    discord_attach_media: bool = os.getenv("DISCORD_ATTACH_MEDIA", "true").lower() == "true"
    discord_max_file_mb: int = int(os.getenv("DISCORD_MAX_FILE_MB", "8"))

    enable_realtime: bool = os.getenv("ENABLE_REALTIME", "true").lower() == "true"
    frontend_dist: str = os.getenv("FRONTEND_DIST", "../frontend/dist")
