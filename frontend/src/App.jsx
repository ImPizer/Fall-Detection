import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import LiveView from "./pages/LiveView.jsx";
import AppShell from "./layouts/AppShell.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import AdminDashboardPage from "./pages/admin/DashboardPage.jsx";
import EventsPage from "./pages/admin/EventsPage.jsx";
import EventDetailPage from "./pages/admin/EventDetailPage.jsx";
import CamerasPage from "./pages/admin/CamerasPage.jsx";
import UsersPage from "./pages/admin/UsersPage.jsx";
import SettingsPage from "./pages/admin/SettingsPage.jsx";
import UserDashboardPage from "./pages/user/DashboardPage.jsx";
import UserEventsPage from "./pages/user/EventsPage.jsx";
import UserEventDetailPage from "./pages/user/EventDetailPage.jsx";

export default function App() {
  const auth = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          auth.isAuthed ? (
            <Navigate to={auth.role === "admin" ? "/admin/dashboard" : "/app/dashboard"} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="/login" element={<Login />} />

      <Route
        element={<ProtectedRoute allowRole="admin" />}
      >
        <Route path="/admin" element={<AppShell mode="admin" />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="events" element={<EventsPage mode="admin" />} />
          <Route path="events/:id" element={<EventDetailPage mode="admin" />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="cameras" element={<CamerasPage />} />
          <Route path="users" element={<UsersPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowRole="user" />}>
        <Route path="/app" element={<AppShell mode="user" />}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<UserDashboardPage />} />
          <Route path="live" element={<LiveView />} />
          <Route path="events" element={<UserEventsPage />} />
          <Route path="events/:id" element={<UserEventDetailPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
