import React from 'react';

/**
 * A small colored badge for severity indicators
 * (HIGH, MED, LOW, CRITICAL) used in evidence
 * bars and verdict category breakdowns.
 */
export function StatusBadge({ 
  level 
}: { level: 'critical' | 'high' | 'medium' | 'low' }) {
  const colors = {
    critical: '#ff4444',
    high: '#ffaa00',
    medium: '#ffaa00',
    low: '#00cc66'
  };
  return (
    <span className="nav-badge" style={{ color: colors[level], borderColor: colors[level] }}>
      {level.toUpperCase()}
    </span>
  );
}
