import React, { useEffect, useState } from "react";
import { apiFetch } from "../services/api.js";

export default function Cameras() {
  const [cams, setCams] = useState([]);
  const [form, setForm] = useState({ name: "", rtsp_url: "", owner_user_id: "" });
  const [error, setError] = useState("");

  async function load() {
    const data = await apiFetch("/cameras");
    setCams(data);
  }

  useEffect(() => {
    load().catch(() => setCams([]));
  }, []);

  async function onAdd(e) {
    e.preventDefault();
    try {
      await apiFetch("/cameras", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          rtsp_url: form.rtsp_url,
          enabled: true,
          owner_user_id: form.owner_user_id ? Number(form.owner_user_id) : null
        })
      });
      setForm({ name: "", rtsp_url: "", owner_user_id: "" });
      setError("");
      await load();
    } catch {
      setError("Add camera failed");
    }
  }

  async function onToggle(cam) {
    await apiFetch(`/cameras/${cam.id}`, {
      method: "PATCH",
      body: JSON.stringify({ enabled: !cam.enabled })
    });
    await load();
  }

  async function onDelete(id) {
    await apiFetch(`/cameras/${id}`, { method: "DELETE" });
    await load();
  }

  async function onInlineEdit(cam, key, value) {
    await apiFetch(`/cameras/${cam.id}`, {
      method: "PATCH",
      body: JSON.stringify({ [key]: value })
    });
    await load();
  }

  return (
    <div className="card">
      <h2>Cameras</h2>
      <form onSubmit={onAdd} className="grid" style={{ maxWidth: 620 }}>
        <input
          className="input"
          placeholder="Camera name"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          required
        />
        <input
          className="input"
          placeholder="RTSP URL / source URL"
          value={form.rtsp_url}
          onChange={(e) => setForm((p) => ({ ...p, rtsp_url: e.target.value }))}
          required
        />
        <input
          className="input"
          placeholder="Owner user id (optional)"
          value={form.owner_user_id}
          onChange={(e) => setForm((p) => ({ ...p, owner_user_id: e.target.value }))}
        />
        <button className="btn" type="submit">
          Add Camera
        </button>
      </form>
      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}

      <table className="table" style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Source</th>
            <th>Owner</th>
            <th>Enabled</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {cams.map((c) => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>
                <input
                  className="input"
                  defaultValue={c.name}
                  onBlur={(e) => onInlineEdit(c, "name", e.target.value)}
                />
              </td>
              <td>
                <input
                  className="input"
                  defaultValue={c.rtsp_url}
                  onBlur={(e) => onInlineEdit(c, "rtsp_url", e.target.value)}
                />
              </td>
              <td>{c.owner_user_id ?? "-"}</td>
              <td>{c.enabled ? "enabled" : "disabled"}</td>
              <td style={{ display: "flex", gap: 8 }}>
                <button className="btn secondary" onClick={() => onToggle(c)}>
                  {c.enabled ? "Disable" : "Enable"}
                </button>
                <button className="btn danger" onClick={() => onDelete(c.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {cams.length === 0 && (
            <tr>
              <td colSpan="6">No cameras configured.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
