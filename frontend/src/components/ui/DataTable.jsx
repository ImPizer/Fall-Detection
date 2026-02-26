import React from "react";

export default function DataTable({
  columns,
  loading,
  emptyText = "No data",
  children,
  rowsCount = 0,
  className = ""
}) {
  return (
    <div className={`ui-table-wrap ${loading ? "is-loading" : ""} ${className}`.trim()}>
      <table className="ui-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {children}
          {!loading && rowsCount === 0 && (
            <tr>
              <td colSpan={columns.length} className="ui-empty-cell">
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
