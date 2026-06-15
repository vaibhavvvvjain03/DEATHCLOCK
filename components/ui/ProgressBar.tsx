import React from 'react';

/**
 * A horizontal progress bar with configurable
 * fill percentage and color. Used for budget
 * consumption, audit progress, and evidence bars.
 */
export function ProgressBar({ 
  percent, color 
}: { percent: number, color?: string }) {
  return (
    <div className="progress-track" style={{ marginBottom: 16 }}>
      <div
        className="progress-fill"
        style={{ 
          width: `${percent}%`,
          ...(color ? { background: color } : {})
        }}
      />
    </div>
  );
}
