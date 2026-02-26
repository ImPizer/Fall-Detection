function hasTimezone(value) {
  return /[zZ]$|[+\-]\d{2}:\d{2}$/.test(value);
}

export function parseEventTime(value) {
  if (!value) return new Date();
  if (typeof value === "string" && !hasTimezone(value)) {
    return new Date(`${value}Z`);
  }
  return new Date(value);
}

export function formatVNTime(value) {
  return parseEventTime(value).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour12: false
  });
}

export function dateKeyVN(value) {
  return parseEventTime(value).toLocaleDateString("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh"
  });
}
