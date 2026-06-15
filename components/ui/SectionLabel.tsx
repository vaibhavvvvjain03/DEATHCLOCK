import React from 'react';

/**
 * Small uppercase monospace section header label
 * used throughout the dossier (e.g. "FIELD 
 * INTELLIGENCE", "EMISSION EVIDENCE").
 */
export function SectionLabel({ 
  children 
}: { children: React.ReactNode }) {
  return (
    <div className="doc-label" style={{ color: "#ffaa00", marginBottom: 16 }}>
      {children}
    </div>
  );
}
