export function getSeverity(confidence) {
  const score = Number(confidence || 0);
  if (score >= 0.85) return "critical";
  if (score >= 0.65) return "high";
  if (score >= 0.45) return "medium";
  return "low";
}

export function severityClass(severity) {
  if (severity === "critical") return "tag tag-critical";
  if (severity === "high") return "tag tag-high";
  if (severity === "medium") return "tag tag-medium";
  return "tag tag-low";
}

export function statusLabel(event) {
  return event?.ack ? "acknowledged" : "new";
}

export function statusClass(event) {
  return event?.ack ? "tag tag-ack" : "tag tag-new";
}
