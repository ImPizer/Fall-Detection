import React from "react";

export default function Modal({ open, title, children, onClose, actions }) {
  if (!open) return null;

  return (
    <div className="ui-modal-backdrop" onClick={onClose}>
      <div className="ui-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <header className="ui-modal-header">
          <h3>{title}</h3>
        </header>
        <div className="ui-modal-body">{children}</div>
        <footer className="ui-modal-actions">{actions}</footer>
      </div>
    </div>
  );
}
