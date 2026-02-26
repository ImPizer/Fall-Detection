import React from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Button from "../components/ui/Button.jsx";

const TITLE_BY_PATH = {
  "/admin/dashboard": "Incident Overview",
  "/admin/events": "Incident Management",
  "/admin/cameras": "Camera Management",
  "/admin/users": "User Management",
  "/admin/settings": "System Settings",
  "/app/dashboard": "My Incident Dashboard",
  "/app/events": "Incident Timeline",
  "/app/live": "Live Monitoring"
};

const SUBTITLE_BY_MODE = {
  admin: "Operations center for incident triage and system control",
  user: "Track incidents, review evidence, and follow status updates"
};

export default function AppShell({ mode }) {
  const auth = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = React.useState(() => localStorage.getItem("theme") || "dark");
  const [pageVisible, setPageVisible] = React.useState(false);

  React.useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  React.useEffect(() => {
    setPageVisible(false);
    const id = window.requestAnimationFrame(() => setPageVisible(true));
    return () => window.cancelAnimationFrame(id);
  }, [location.pathname]);

  function logout() {
    auth.logout();
    nav("/login");
  }

  const items =
    mode === "admin"
      ? [
          { to: "/admin/dashboard", label: "Overview" },
          { to: "/admin/events", label: "Events" },
          { to: "/admin/cameras", label: "Cameras" },
          { to: "/admin/users", label: "Users" },
          { to: "/admin/settings", label: "Settings" }
        ]
      : [
          { to: "/app/dashboard", label: "Dashboard" },
          { to: "/app/events", label: "Events" },
          { to: "/app/live", label: "Live" }
        ];

  const pageTitle = TITLE_BY_PATH[location.pathname] || "Incident Detail";

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-brand">Fall Detection</div>
        <div className="app-mode">{mode === "admin" ? "Admin Workspace" : "User Workspace"}</div>
        <nav className="app-nav">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? "active" : "") }>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="app-sidebar-footer">
          <div className="app-signed">Signed in as {auth.user || "unknown"}</div>
          <Button variant="secondary" onClick={logout}>Logout</Button>
        </div>
      </aside>

      <main className="app-main">
        <header className="app-header">
          <div>
            <h1>{pageTitle}</h1>
            <p>{SUBTITLE_BY_MODE[mode]}</p>
          </div>
          <div className="app-header-actions">
            <Button variant="secondary" onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}>
              {theme === "dark" ? "Light" : "Dark"} Mode
            </Button>
          </div>
        </header>

        <section className={`app-content app-page-enter ${pageVisible ? "is-visible" : ""}`}>
          <Outlet />
        </section>
      </main>
    </div>
  );
}
