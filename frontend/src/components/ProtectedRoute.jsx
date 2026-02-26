import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ allowRole = null }) {
  const auth = useAuth();
  const location = useLocation();

  if (!auth.isAuthed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowRole && auth.role !== allowRole) {
    const fallback = auth.role === "admin" ? "/admin/dashboard" : "/app/dashboard";
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}
