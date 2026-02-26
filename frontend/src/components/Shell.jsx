import React from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Shell({ mode }) {
  const nav = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const [theme, setTheme] = React.useState(() => localStorage.getItem("theme") || "dark");
  const [pageVisible, setPageVisible] = React.useState(false);

  function doLogout() {
    auth.logout();
    nav("/login");
  }

  React.useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  React.useEffect(() => {
    setPageVisible(false);
    const id = window.requestAnimationFrame(() => setPageVisible(true));
    return () => window.cancelAnimationFrame(id);
  }, [location.pathname]);

  const isAdmin = mode === "admin";
  const pageTitleMap = {
    "/admin/dashboard": "System Overview",
    "/admin/events": "Incident Management",
    "/admin/cameras": "Camera Monitoring",
    "/admin/settings": "Detection Settings",
    "/admin/users": "User Management",
    "/app/dashboard": "Safety Overview",
    "/app/live": "Live Monitoring",
    "/app/events": "Incident Timeline"
  };
  const pageTitle = pageTitleMap[location.pathname] || "Incident Detail";
  const items = isAdmin
    ? [
        { to: "/admin/dashboard", label: "Overview" },
        { to: "/admin/events", label: "Events" },
        { to: "/admin/cameras", label: "Cameras" },
        { to: "/admin/settings", label: "Settings" },
        { to: "/admin/users", label: "Users" }
      ]
    : [
        { to: "/app/dashboard", label: "Overview" },
        { to: "/app/live", label: "Live View" },
        { to: "/app/events", label: "Events" }
      ];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">Fall Detection</div>
        <div className="badge">{isAdmin ? "Admin" : "User"} Mode</div>
        <nav className="nav">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-user">Signed in as: {auth.user || "unknown"}</div>
        <button className="btn secondary" onClick={doLogout}>
          Logout
        </button>
      </aside>
      <main className="content">
        <header className="topbar card">
          <div>
            <div className="topbar-title">{pageTitle}</div>
            <div className="topbar-sub">Safety monitoring and incident detection dashboard</div>
          </div>
          <div className="topbar-actions">
            <button
              className="btn secondary"
              onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
            >
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </button>
          </div>
        </header>
        <section className={`page-body page-enter ${pageVisible ? "is-visible" : ""}`}>
          <Outlet />
        </section>
      </main>
    </div>
  );
}
