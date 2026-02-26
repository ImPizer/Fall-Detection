import os
import subprocess
from pathlib import Path
from typing import Optional


class RealtimeProcess:
    def __init__(self) -> None:
        self.proc: Optional[subprocess.Popen] = None

    def start(self) -> None:
        if self.proc and self.proc.poll() is None:
            return
        project_root = Path(__file__).resolve().parents[3]
        cmd = ["python", "realtime.py"]
        env = os.environ.copy()
        env.setdefault("BACKEND_URL", "http://127.0.0.1:8000")
        self.proc = subprocess.Popen(cmd, env=env, cwd=str(project_root))

    def stop(self) -> None:
        if not self.proc:
            return
        if self.proc.poll() is None:
            self.proc.terminate()
