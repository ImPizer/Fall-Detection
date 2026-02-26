import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { apiFetch } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const auth = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setError("");
  }, [username, password]);

  if (auth.isAuthed) {
    return <Navigate to={auth.role === "admin" ? "/admin/dashboard" : "/app/dashboard"} replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });
      const nextRole = data.role || "user";
      auth.login({
        token: data.access_token,
        role: nextRole,
        user: data.user || username
      });
      nav(nextRole === "admin" ? "/admin/dashboard" : "/app/dashboard", { replace: true });
    } catch (err) {
      setError("Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login">
      <form className="login-box" onSubmit={onSubmit}>
        <h2>Fall Detection Login</h2>
        <p style={{ color: "var(--muted)" }}>
          Sign in with your account role (admin or user).
        </p>
        <div style={{ display: "grid", gap: 12 }}>
          <input
            className="input"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            className="input"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <div style={{ color: "var(--danger)" }}>{error}</div>}
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </div>
      </form>
    </div>
  );
}
