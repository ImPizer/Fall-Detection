import os
import requests


class BackendClient:
    def __init__(self) -> None:
        self.base_url = os.getenv("BACKEND_URL", "http://localhost:8000")
        self.ingest_key = os.getenv("INGEST_KEY", "ingest-secret")

    def ingest_event(self, payload: dict) -> None:
        url = f"{self.base_url}/events/ingest"
        headers = {"X-INGEST-KEY": self.ingest_key}
        try:
            requests.post(url, json=payload, headers=headers, timeout=3)
        except requests.RequestException:
            pass
