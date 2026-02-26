import React from "react";

export default function Badge({ children, tone = "default", pulse = false, className = "" }) {
  return (
    <span className={`ui-badge ui-badge-${tone} ${pulse ? "ui-badge-pulse" : ""} ${className}`.trim()}>
      {children}
    </span>
  );
}
