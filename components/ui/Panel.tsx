import React from 'react';

/**
 * A bordered box with subtle left-border accent,
 * used for "intelligence box" style content 
 * (Field Intelligence, Key Finding, Personal 
 * Decay Rate boxes in the dossier, and any 
 * similar bordered sections on the landing page).
 */
export function Panel({ 
  children, className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className={`intel-box ${className || ""}`}>
      {children}
    </div>
  );
}
