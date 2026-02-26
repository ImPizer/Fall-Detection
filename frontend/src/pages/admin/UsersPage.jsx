import React, { useEffect, useState } from "react";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import Modal from "../../components/ui/Modal.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { apiFetch } from "../../services/api.js";

const EMPTY_FORM = { username: "", password: "", role: "user", enabled: true };

export default function UsersPage() {
  const { pushToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const columns = [
    { key: "id", label: "ID" },
    { key: "username", label: "Username" },
    { key: "role", label: "Role" },
    { key: "enabled", label: "Status" },
    { key: "password", label: "Password" },
    { key: "actions", label: "Actions" }
  ];

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch("/users");
      setUsers(data);
    } catch {
      setUsers([]);
      pushToast("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => null);
  }, []);

  async function createUser(e) {
    e.preventDefault();
    try {
      await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify(form)
      });
      pushToast("User created", "success");
      setForm(EMPTY_FORM);
      setModalOpen(false);
      await load();
    } catch {
      pushToast("Create failed", "error");
    }
  }

  async function updateUser(id, payload) {
    try {
      await apiFetch(`/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      pushToast("User updated", "success");
      await load();
    } catch {
      pushToast("Update failed", "error");
    }
  }

  async function deleteUser(id) {
    try {
      await apiFetch(`/users/${id}`, { method: "DELETE" });
      pushToast("User deleted", "success");
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
            <h2>Users</h2>
            <p>Create and manage access roles.</p>
          </div>
          <Button onClick={() => setModalOpen(true)}>Add User</Button>
        </div>

        <DataTable columns={columns} loading={loading} rowsCount={users.length} emptyText="No users configured">
          {users.map((u) => (
            <tr key={u.id}>
              <td>#{u.id}</td>
              <td>{u.username}</td>
              <td>
                <select
                  className="ui-input"
                  value={u.role}
                  onChange={(e) => updateUser(u.id, { role: e.target.value })}
                >
                  <option value="admin">admin</option>
                  <option value="user">user</option>
                </select>
              </td>
              <td>
                <select
                  className="ui-input"
                  value={u.enabled ? "true" : "false"}
                  onChange={(e) => updateUser(u.id, { enabled: e.target.value === "true" })}
                >
                  <option value="true">enabled</option>
                  <option value="false">disabled</option>
                </select>
              </td>
              <td>
                <input
                  className="ui-input"
                  placeholder="new password"
                  onBlur={(e) => e.target.value && updateUser(u.id, { password: e.target.value })}
                />
              </td>
              <td>
                <Button variant="danger" onClick={() => deleteUser(u.id)}>
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </DataTable>
      </Card>

      <Modal
        open={modalOpen}
        title="Create User"
        onClose={() => setModalOpen(false)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createUser}>Create</Button>
          </>
        }
      >
        <form className="form-stack" onSubmit={createUser}>
          <input
            className="ui-input"
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
            required
          />
          <input
            className="ui-input"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            required
          />
          <select
            className="ui-input"
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
          >
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
          <select
            className="ui-input"
            value={form.enabled ? "true" : "false"}
            onChange={(e) => setForm((p) => ({ ...p, enabled: e.target.value === "true" }))}
          >
            <option value="true">enabled</option>
            <option value="false">disabled</option>
          </select>
        </form>
      </Modal>
    </div>
  );
}
