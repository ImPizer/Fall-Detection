import React, { createContext, useContext, useMemo, useState } from "react";
import { clearSession, getSession, saveSession } from "../services/auth.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getSession());

  const value = useMemo(() => {
    const role = session?.role || null;
    return {
      isAuthed: Boolean(session?.token),
      token: session?.token || "",
      user: session?.user || "",
      role,
      isAdmin: role === "admin",
      login(nextSession) {
        saveSession(nextSession);
        setSession(nextSession);
      },
      logout() {
        clearSession();
        setSession(null);
      }
    };
  }, [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
