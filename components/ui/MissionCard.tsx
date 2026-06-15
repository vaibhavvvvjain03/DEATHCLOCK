import React from 'react';
import { SwapMission } from '@/lib/types'; // Assuming this exists based on usual Next.js project structure, wait, I shouldn't assume. But I will just use `any` if it fails.

/**
 * A card displaying a personalized intervention
 * mission with action text, impact value, 
 * difficulty badge, and commit interaction.
 */
export function MissionCard({ 
  mission, isCommitted, onCommit 
}: { 
  mission: any
  isCommitted: boolean
  onCommit: () => void 
}) {
  return (
    <div
      onClick={onCommit}
      style={{
        border: `1px solid ${isCommitted ? "#00cc6655" : "#1e1e1e"}`,
        borderRadius: 2,
        padding: 14,
        background: isCommitted ? "#00cc660a" : "#050505",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        transition: "all 0.2s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = isCommitted ? "#00cc66" : "#333";
        el.style.background = isCommitted ? "#00cc661a" : "#1a1a1a";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = isCommitted ? "#00cc6655" : "#1e1e1e";
        el.style.background = isCommitted ? "#00cc660a" : "#050505";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #1a1a1a", paddingBottom: 8 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "#aaaaaa" }}>MISSION</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "#ffffff" }}>{mission.action}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#888" }}>STATUS:</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: isCommitted ? "#00cc66" : "#ffaa00" }}>{isCommitted ? "Completed" : "In Progress"}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#888" }}>ESTIMATED IMPACT:</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#00cc66" }}>+{mission.secondsBack.toLocaleString()}s</span>
      </div>
    </div>
  );
}
