import React, { useEffect, useState } from "react";
import { apiFetch } from "../services/api.js";

const DEFAULTS = {
  confThres: 0.25,
  fallWindow: 8,
  aspectRatioThres: 1.4,
  poseYDiff: 0.05,
  preBufferSec: 2,
  postBufferSec: 3,
  cooldownSec: 5,
  storageDays: 7,
  notifyEnabled: true,
  notifyChannels: "in-app"
};

export default function Settings() {
  const [form, setForm] = useState(DEFAULTS);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    apiFetch("/settings")
      .then((data) => setForm(data))
      .catch(() => setForm(DEFAULTS));
  }, []);

  function setField(key, value) {
    setSaved("");
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSave(e) {
    e.preventDefault();
    setError("");
    setSaved("");
    try {
      const data = await apiFetch("/settings", {
        method: "PUT",
        body: JSON.stringify(form)
      });
      setForm(data);
      setSaved("Settings saved");
    } catch {
      setError("Invalid settings values");
    }
  }

  return (
    <div className="card">
      <div className="header">
        <h2>Detection Settings</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn secondary" onClick={() => setForm(DEFAULTS)}>
            Reset Defaults
          </button>
          <button className="btn" onClick={onSave}>
            Save
          </button>
        </div>
      </div>

      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
      {saved && <p style={{ color: "var(--ok)" }}>{saved}</p>}

      <form className="grid cols-2" onSubmit={onSave}>
        <div className="card">
          <h3>Detection Thresholds</h3>
          <label>Confidence threshold</label>
          <input className="input" type="number" step="0.01" value={form.confThres} onChange={(e) => setField("confThres", Number(e.target.value))} />
          <small className="sidebar-user">Minimum model confidence to accept detection.</small>

          <label>Fall window (frames)</label>
          <input className="input" type="number" value={form.fallWindow} onChange={(e) => setField("fallWindow", Number(e.target.value))} />
          <small className="sidebar-user">Number of frames used to confirm a fall event.</small>

          <label>Aspect ratio threshold</label>
          <input className="input" type="number" step="0.01" value={form.aspectRatioThres} onChange={(e) => setField("aspectRatioThres", Number(e.target.value))} />
          <small className="sidebar-user">Horizontal/vertical body bbox ratio trigger.</small>

          <label>Pose Y diff</label>
          <input className="input" type="number" step="0.01" value={form.poseYDiff} onChange={(e) => setField("poseYDiff", Number(e.target.value))} />
          <small className="sidebar-user">Keypoint Y-axis displacement threshold.</small>
        </div>

        <div className="card">
          <h3>Buffering & Notification</h3>
          <label>Pre buffer (sec)</label>
          <input className="input" type="number" value={form.preBufferSec} onChange={(e) => setField("preBufferSec", Number(e.target.value))} />
          <small className="sidebar-user">Seconds saved before incident trigger.</small>

          <label>Post buffer (sec)</label>
          <input className="input" type="number" value={form.postBufferSec} onChange={(e) => setField("postBufferSec", Number(e.target.value))} />
          <small className="sidebar-user">Seconds saved after incident trigger.</small>

          <label>Cooldown (sec)</label>
          <input className="input" type="number" value={form.cooldownSec} onChange={(e) => setField("cooldownSec", Number(e.target.value))} />
          <small className="sidebar-user">Spam guard between incidents.</small>

          <label>Storage days</label>
          <input className="input" type="number" value={form.storageDays} onChange={(e) => setField("storageDays", Number(e.target.value))} />
          <small className="sidebar-user">Retention period for clips/snapshots.</small>

          <label>Notify enabled</label>
          <select className="input" value={form.notifyEnabled ? "true" : "false"} onChange={(e) => setField("notifyEnabled", e.target.value === "true")}>
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>

          <label>Notify channels</label>
          <input className="input" value={form.notifyChannels} onChange={(e) => setField("notifyChannels", e.target.value)} />
          <small className="sidebar-user">Examples: in-app,email</small>
        </div>
      </form>
    </div>
  );
}
