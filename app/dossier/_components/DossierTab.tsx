"use client";
import { CarbonData } from "@/lib/types";
import { DataField } from "@/components/ui/DataField";

function formatBudget(n: number): string {
  if (!n) return "—";
  if (n > 1e12) return `${(n / 1e12).toFixed(1)}T TONNES CO₂`;
  if (n > 1e9) return `${(n / 1e9).toFixed(1)}B TONNES CO₂`;
  if (n > 1e6) return `${(n / 1e6).toFixed(1)}M TONNES CO₂`;
  return `${n.toLocaleString()} TONNES CO₂`;
}

function formatEmissions(n: number): string {
  if (!n) return "—";
  if (n > 1e9) return `${(n / 1e9).toFixed(2)}B T/YR`;
  if (n > 1e6) return `${(n / 1e6).toFixed(1)}M T/YR`;
  return `${n.toLocaleString()} T/YR`;
}

interface DossierTabProps {
  city: string;
  apiData: CarbonData | null;
  isMobile: boolean;
  onNext: () => void;
}

export function DossierTab({ city, apiData, isMobile, onNext }: DossierTabProps) {
  return (
    <div style={{ padding: isMobile ? "16px" : "24px 28px", overflowY: "auto", flex: 1, maxWidth: "100%", overflowX: "hidden", display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Top Header Section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "1px solid #ff444433", paddingBottom: 12 }}>
        <div>
          <div className="doc-label" style={{ color: "#ff4444", marginBottom: 4 }}>
            ███████ CLASSIFIED DOSSIER
          </div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: isMobile ? 24 : 32, fontWeight: 600, color: "#ffffff", letterSpacing: 2, textTransform: "uppercase", lineHeight: 1 }}>
            {city}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#bbbbbb", letterSpacing: 3, textTransform: "uppercase", marginTop: 8 }}>
            TARGET REGION · 19.0°N 72.8°E
          </div>
        </div>
        <div
          style={{
            transform: "rotate(-4deg)",
            border: "2px solid #ff4444",
            color: "#ff4444",
            fontFamily: "var(--font-mono)",
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: 4,
            padding: "4px 10px",
            borderRadius: 2,
            boxShadow: "0 0 10px rgba(255, 68, 68, 0.2)",
            flexShrink: 0,
            marginLeft: 12,
          }}
        >
          RESTRICTED
        </div>
      </div>

      <div style={{ display: "flex", gap: 24, flexDirection: isMobile ? "column" : "row" }}>
        {/* Radar Map Visual */}
        <div style={{
          width: isMobile ? "100%" : 200,
          height: isMobile ? 120 : "auto",
          border: "1px solid #1a1a1a",
          background: "#080808",
          position: "relative",
          overflow: "hidden",
          flexShrink: 0
        }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
          <div style={{ position: "absolute", top: "40%", left: "60%", width: 6, height: 6, background: "#ff4444", borderRadius: "50%", boxShadow: "0 0 15px 2px #ff4444" }} />
          {/* Crosshairs */}
          <div style={{ position: "absolute", top: "40%", left: 0, right: 0, height: 1, background: "rgba(255, 68, 68, 0.3)" }} />
          <div style={{ position: "absolute", top: 0, bottom: 0, left: "60%", width: 1, background: "rgba(255, 68, 68, 0.3)" }} />
          <div style={{ position: "absolute", bottom: 8, left: 8, fontFamily: "var(--font-mono)", fontSize: 16, color: "#555", letterSpacing: 2 }}>
            SAT-LINK ACTIVE
          </div>
        </div>

        <div style={{ border: "1px solid #1a1a1a", background: "#050505", position: "relative", flex: 1 }}>
          {/* Corner brackets */}
          <div style={{ position: "absolute", top: 0, left: 0, width: 8, height: 8, borderTop: "2px solid #555", borderLeft: "2px solid #555", zIndex: 2 }} />
          <div style={{ position: "absolute", top: 0, right: 0, width: 8, height: 8, borderTop: "2px solid #555", borderRight: "2px solid #555", zIndex: 2 }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, width: 8, height: 8, borderBottom: "2px solid #555", borderLeft: "2px solid #555", zIndex: 2 }} />
          <div style={{ position: "absolute", bottom: 0, right: 0, width: 8, height: 8, borderBottom: "2px solid #555", borderRight: "2px solid #555", zIndex: 2 }} />

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 1, background: "#1a1a1a" }}>
            {[
              { label: "CARBON BUDGET", value: formatBudget(apiData?.remainingBudgetTonnes ?? 0), color: "#ffaa00" },
              { label: "SURVIVAL PROBABILITY", value: "47%", color: "#ff4444" },
              { label: "ANNUAL EMISSIONS", value: formatEmissions(apiData?.annualEmissionRate ?? 0), color: "#ff4444" },
              { label: "THREAT CLASS", value: "ALPHA-1 CRITICAL", color: "#ff4444" },
              { label: "POPULATION AT RISK", value: "24.4M RESIDENTS", color: "#ffaa00" },
              { label: "AUTHORIZATION", value: "PUBLIC ACCESS", color: "#00cc66" },
            ].map((cell, i) => (
              <DataField
                key={i}
                label={cell.label}
                value={cell.value}
                variant={cell.color === "#ff4444" ? "danger" : cell.color === "#ffaa00" ? "warning" : cell.color === "#00cc66" ? "success" : "default"}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Skipped Panel replacement here to prevent visual differences (custom border-left color and inline styles) */}
      <div className="intel-box" style={{ background: "#080808", border: "1px solid #1a1a1a", borderLeft: "2px solid #00cc66" }}>
        <div className="intel-label" style={{ color: "#00cc66" }}>FIELD INTELLIGENCE</div>
        <div className="intel-text" style={{ color: "#e0e0e0", fontSize: 13, lineHeight: 1.6 }}>
          {apiData?.contextSentence || "Carbon telemetry systems are online. Intelligence data is being processed for this target location."}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "auto", paddingTop: 10 }}>
        <button
          className="btn-ghost"
          onClick={onNext}
          style={{ width: isMobile ? "100%" : "auto", padding: "12px 32px" }}
          aria-label="Next step: Evidence"
        >
          NEXT ›
        </button>
      </div>
    </div>
  );
}
