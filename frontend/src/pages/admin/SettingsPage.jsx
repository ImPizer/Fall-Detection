import React, { useEffect, useState } from "react";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { apiFetch } from "../../services/api.js";

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

export default function SettingsPage() {
  const { pushToast } = useToast();
  const [form, setForm] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch("/settings")
      .then((data) => setForm(data))
      .catch(() => setForm(DEFAULTS));
  }, []);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await apiFetch("/settings", {
        method: "PUT",
        body: JSON.stringify(form)
      });
      setForm(data);
      pushToast("Settings saved", "success");
    } catch {
      pushToast("Save failed", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-stack">
      <Card>
        <div className="section-head">
          <div>
            <h2>System Settings</h2>
            <p>Configure thresholds, retention, and notification policy.</p>
          </div>
          <div className="inline-actions">
            <Button variant="secondary" onClick={() => setForm(DEFAULTS)}>Reset</Button>
            <Button loading={saving} onClick={onSave}>Save</Button>
          </div>
        </div>
      </Card>

      <form className="settings-grid" onSubmit={onSave}>
        <Card>
          <h3>Detection Thresholds</h3>
          <div className="form-grid">
            <label>Confidence threshold</label>
            <input className="ui-input" type="number" step="0.01" value={form.confThres} onChange={(e) => setField("confThres", Number(e.target.value))} />
            <label>Fall window (frames)</label>
            <input className="ui-input" type="number" value={form.fallWindow} onChange={(e) => setField("fallWindow", Number(e.target.value))} />
            <label>Aspect ratio threshold</label>
            <input className="ui-input" type="number" step="0.01" value={form.aspectRatioThres} onChange={(e) => setField("aspectRatioThres", Number(e.target.value))} />
            <label>Pose Y diff</label>
            <input className="ui-input" type="number" step="0.01" value={form.poseYDiff} onChange={(e) => setField("poseYDiff", Number(e.target.value))} />
          </div>
        </Card>

        <Card>
          <h3>Storage & Buffer</h3>
          <div className="form-grid">
            <label>Pre buffer (sec)</label>
            <input className="ui-input" type="number" value={form.preBufferSec} onChange={(e) => setField("preBufferSec", Number(e.target.value))} />
            <label>Post buffer (sec)</label>
            <input className="ui-input" type="number" value={form.postBufferSec} onChange={(e) => setField("postBufferSec", Number(e.target.value))} />
            <label>Cooldown (sec)</label>
            <input className="ui-input" type="number" value={form.cooldownSec} onChange={(e) => setField("cooldownSec", Number(e.target.value))} />
            <label>Retention (days)</label>
            <input className="ui-input" type="number" value={form.storageDays} onChange={(e) => setField("storageDays", Number(e.target.value))} />
          </div>
        </Card>

        <Card>
          <h3>Notifications</h3>
          <div className="form-grid">
            <label>Enable notifications</label>
            <select className="ui-input" value={form.notifyEnabled ? "true" : "false"} onChange={(e) => setField("notifyEnabled", e.target.value === "true")}>
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
            <label>Channels</label>
            <input className="ui-input" value={form.notifyChannels} onChange={(e) => setField("notifyChannels", e.target.value)} />
            <label>Timezone (display)</label>
            <input className="ui-input" value="Asia/Ho_Chi_Minh" readOnly />
          </div>
        </Card>
      </form>
    </div>
  );
}
