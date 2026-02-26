const AUTH_KEY = "auth_session";

export function saveSession(session) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));
}

export function getSession() {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getToken() {
  return getSession()?.token || "";
}

export function clearSession() {
  localStorage.removeItem(AUTH_KEY);
}
