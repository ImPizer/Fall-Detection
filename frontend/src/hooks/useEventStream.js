import { useEffect } from "react";
import { getWsUrl } from "../services/api.js";

export default function useEventStream(onEvent) {
  useEffect(() => {
    const ws = new WebSocket(getWsUrl());
    ws.onmessage = (evt) => {
      try {
        const payload = JSON.parse(evt.data);
        if (payload.type === "fall_event") {
          onEvent(payload);
        }
      } catch {
        return;
      }
    };
    return () => ws.close();
  }, [onEvent]);
}
