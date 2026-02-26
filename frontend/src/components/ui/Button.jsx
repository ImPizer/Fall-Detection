import React from "react";

export default function Button({
  children,
  variant = "primary",
  className = "",
  loading = false,
  ...props
}) {
  return (
    <button
      {...props}
      className={`ui-btn ui-btn-${variant} ${loading ? "is-loading" : ""} ${className}`.trim()}
      disabled={loading || props.disabled}
    >
      <span className="ui-btn-label">{loading ? "Please wait..." : children}</span>
    </button>
  );
}
