import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function RequireAuth({ children }) {
  const { loading, session } = useAuth();
  const location = useLocation();

  if (loading) return <div style={{ padding: 16 }}>Chargement…</div>;
  if (!session) {
    const from = `${location.pathname}${location.search || ""}${location.hash || ""}`;
    return <Navigate to="/login" replace state={{ from }} />;
  }
  return children;
}
