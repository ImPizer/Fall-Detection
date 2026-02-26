import React, { useEffect, useState } from "react";
import { apiFetch } from "../services/api.js";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: "", password: "", role: "user", enabled: true });
  const [error, setError] = useState("");

  async function loadUsers() {
    try {
      const data = await apiFetch("/users");
      setUsers(data);
      setError("");
    } catch {
      setError("Cannot load users. Login with admin to access.");
      setUsers([]);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function onCreate(e) {
    e.preventDefault();
    try {
      await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify(form)
      });
      setForm({ username: "", password: "", role: "user", enabled: true });
      await loadUsers();
      setError("");
    } catch {
      setError("Create user failed");
    }
  }

  async function onUpdate(userId, payload) {
    await apiFetch(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    await loadUsers();
  }

  async function onDelete(userId) {
    await apiFetch(`/users/${userId}`, { method: "DELETE" });
    await loadUsers();
  }

  return (
    <div className="card">
      <div className="header">
        <h2>Users</h2>
      </div>

      <form onSubmit={onCreate} className="grid" style={{ maxWidth: 620 }}>
        <input
          className="input"
          placeholder="username"
          value={form.username}
          onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
          required
        />
        <input
          className="input"
          placeholder="password"
          type="password"
          value={form.password}
          onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          required
        />
        <select className="input" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
        <select
          className="input"
          value={form.enabled ? "true" : "false"}
          onChange={(e) => setForm((p) => ({ ...p, enabled: e.target.value === "true" }))}
        >
          <option value="true">enabled</option>
          <option value="false">disabled</option>
        </select>
        <button className="btn" type="submit">
          Create User
        </button>
      </form>

      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}

      <table className="table" style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Role</th>
            <th>Status</th>
            <th>Password</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.username}</td>
              <td>
                <select className="input" value={u.role} onChange={(e) => onUpdate(u.id, { role: e.target.value })}>
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td>
                <select
                  className="input"
                  value={u.enabled ? "true" : "false"}
                  onChange={(e) => onUpdate(u.id, { enabled: e.target.value === "true" })}
                >
                  <option value="true">enabled</option>
                  <option value="false">disabled</option>
                </select>
              </td>
              <td>
                <input
                  className="input"
                  placeholder="new password"
                  onBlur={(e) => e.target.value && onUpdate(u.id, { password: e.target.value })}
                />
              </td>
              <td>
                <button className="btn danger" onClick={() => onDelete(u.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan="6">No users.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
