import React from 'react';

/**
 * A label/value pair styled as a classified 
 * document field. Used in the dossier data grid
 * and verdict summary cells.
 */
export function DataField({ 
  label, value, variant = 'default' 
}: { 
  label: string
  value: string | number
  variant?: 'default' | 'danger' | 'warning' | 'success'
}) {
  const colors = {
    danger: '#ff4444',
    warning: '#ffaa00',
    success: '#00cc66',
    default: '#ffffff'
  };
  const color = colors[variant];
  return (
    <div
      style={{
        background: "#080808",
        padding: "20px 24px",
      }}
    >
      <div className="doc-label" style={{ marginBottom: 8, color: "#666" }}>{label}</div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 16,
          color: color,
          fontVariantNumeric: "tabular-nums",
          fontWeight: 500,
          textShadow: `0 0 10px ${color}40`,
        }}
      >
        {value}
      </div>
    </div>
  );
}
