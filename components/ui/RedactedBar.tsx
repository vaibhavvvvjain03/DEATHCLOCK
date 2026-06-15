import React from 'react';

/**
 * A placeholder bar representing redacted or 
 * loading classified data. Used on the landing
 * page for ANALYST/AUTHORIZATION fields, and on
 * the scanning page as the initial loading state
 * for each data line before it reveals.
 */
export function RedactedBar({ 
  width 
}: { width: number | string }) {
  return (
    <span className="redacted" style={{ width }} />
  );
}
