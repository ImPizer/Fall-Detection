import React, { useEffect, useState } from "react";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import Modal from "../../components/ui/Modal.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { apiFetch } from "../../services/api.js";

const EMPTY_FORM = { name: "", rtsp_url: "", owner_user_id: "" };

export default function CamerasPage() {
  const { pushToast } = useToast();
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "source", label: "Source" },
    { key: "owner", label: "Owner" },
    { key: "status", label: "Status" },
    { key: "action", label: "Actions" }
  ];

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch("/cameras");
      setCameras(data);
    } catch {
      setCameras([]);
      pushToast("Failed to load cameras", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => null);
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(cam) {
    setEditing(cam);
    setForm({
      name: cam.name || "",
      rtsp_url: cam.rtsp_url || "",
      owner_user_id: cam.owner_user_id ? String(cam.owner_user_id) : ""
    });
    setModalOpen(true);
  }

  async function submitForm(e) {
    e.preventDefault();
    const payload = {
      name: form.name,
      rtsp_url: form.rtsp_url,
      owner_user_id: form.owner_user_id ? Number(form.owner_user_id) : null
    };

    try {
      if (editing) {
        await apiFetch(`/cameras/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });
        pushToast("Camera updated", "success");
      } else {
        await apiFetch("/cameras", {
          method: "POST",
          body: JSON.stringify({ ...payload, enabled: true })
        });
        pushToast("Camera added", "success");
      }
      setModalOpen(false);
      await load();
    } catch {
      pushToast("Save failed", "error");
    }
  }

  async function toggle(cam) {
    try {
      await apiFetch(`/cameras/${cam.id}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled: !cam.enabled })
      });
      pushToast(cam.enabled ? "Camera disabled" : "Camera enabled", "success");
      await load();
    } catch {
      pushToast("Action failed", "error");
    }
  }

  async function removeCamera(id) {
    try {
      await apiFetch(`/cameras/${id}`, { method: "DELETE" });
      pushToast("Camera removed", "success");
      await load();
    } catch {
      pushToast("Delete failed", "error");
    }
  }

  return (
    <div className="page-stack">
      <Card>
        <div className="section-head">
          <div>
            <h2>Cameras</h2>
            <p>Add, update and disable camera sources.</p>
          </div>
          <Button onClick={openCreate}>Add Camera</Button>
        </div>

        <DataTable columns={columns} loading={loading} rowsCount={cameras.length} emptyText="No cameras configured">
          {cameras.map((cam) => (
            <tr key={cam.id}>
              <td>#{cam.id}</td>
              <td>{cam.name}</td>
              <td className="truncate-cell">{cam.rtsp_url}</td>
              <td>{cam.owner_user_id ?? "-"}</td>
              <td>{cam.enabled ? "Enabled" : "Disabled"}</td>
              <td>
                <div className="inline-actions">
                  <Button variant="secondary" onClick={() => openEdit(cam)}>
                    Edit
                  </Button>
                  <Button variant="secondary" onClick={() => toggle(cam)}>
                    {cam.enabled ? "Disable" : "Enable"}
                  </Button>
                  <Button variant="danger" onClick={() => removeCamera(cam.id)}>
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </Card>

      <Modal
        open={modalOpen}
        title={editing ? "Edit Camera" : "Add Camera"}
        onClose={() => setModalOpen(false)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitForm}>{editing ? "Save" : "Create"}</Button>
          </>
        }
      >
        <form className="form-stack" onSubmit={submitForm}>
          <input
            className="ui-input"
            placeholder="Camera name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
          />
          <input
            className="ui-input"
            placeholder="RTSP URL / source URL"
            value={form.rtsp_url}
            onChange={(e) => setForm((p) => ({ ...p, rtsp_url: e.target.value }))}
            required
          />
          <input
            className="ui-input"
            placeholder="Owner user id (optional)"
            value={form.owner_user_id}
            onChange={(e) => setForm((p) => ({ ...p, owner_user_id: e.target.value }))}
          />
        </form>
      </Modal>
    </div>
  );
}
