import { getToken } from "./auth.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Request failed");
  }
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  return res.text();
}

export function getWsUrl() {
  const base = API_URL.replace("http", "ws");
  const token = encodeURIComponent(getToken());
  return `${base}/ws/events?token=${token}`;
}

export function fileUrl(filenameOrPath) {
  if (!filenameOrPath) return "";
  if (filenameOrPath.startsWith("http")) return filenameOrPath;
  if (filenameOrPath.startsWith("/clips/")) return `${API_URL}${filenameOrPath}`;
  const cleaned = String(filenameOrPath).replace(/\\/g, "/").split("/").pop();
  return `${API_URL}/clips/${cleaned}`;
}

export const API_BASE_URL = API_URL;

export async function downloadEventsCsv(filters = {}) {
  const token = getToken();
  const query = new URLSearchParams();
  if (filters.cameraId) query.set("cameraId", filters.cameraId);
  if (filters.status) query.set("status", filters.status);
  if (filters.from) query.set("from", filters.from);
  if (filters.to) query.set("to", filters.to);
  const url = `${API_URL}/export${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) {
    throw new Error("Export failed");
  }
  const blob = await res.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "events.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}
