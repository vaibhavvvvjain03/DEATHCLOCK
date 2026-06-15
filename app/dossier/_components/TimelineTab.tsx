/**
 * TIMELINE TAB
 * Shows the live carbon budget breach countdown (years, days, h:m:s) for
 * the selected city, a depleted-budget progress bar, and a personal decay
 * rate panel that prompts the user to start the carbon audit.
 */
"use client";

interface CountdownValue {
  yrs: number;
  days: number;
  hh: string;
  mm: string;
  ss: string;
}

interface TimelineTabProps {
  city: string;
  isMobile: boolean;
  countdown: CountdownValue;
  auditDone: boolean;
  totalBurnRate: number;
  onGoToAudit: () => void;
}

function formatBurnRate(sPerDay: number): string {
  return `${sPerDay.toLocaleString()}s / DAY`;
}

export function TimelineTab({ city, isMobile, countdown, auditDone, totalBurnRate, onGoToAudit }: TimelineTabProps) {
  return (
    <div style={{ padding: isMobile ? "16px" : "24px 28px", overflowY: "auto", flex: 1, maxWidth: "100%", overflowX: "hidden", display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Top Header Section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "1px solid #ff444433", paddingBottom: 12 }}>
        <div>
          <div className="doc-label" style={{ color: "#ff4444", marginBottom: 4 }}>
            ███████ LIVE CRITICAL FEED
          </div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: isMobile ? 18 : 24, fontWeight: 600, color: "#ffffff", letterSpacing: 2, textTransform: "uppercase" }}>
            COUNTDOWN TELEMETRY // {city}
          </div>
        </div>
      </div>

      <div style={{ border: "1px solid #1a1a1a", background: "#080808", padding: isMobile ? 20 : 40, position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Corner brackets */}
        <div style={{ position: "absolute", top: 0, left: 0, width: 12, height: 12, borderTop: "2px solid #555", borderLeft: "2px solid #555" }} />
        <div style={{ position: "absolute", top: 0, right: 0, width: 12, height: 12, borderTop: "2px solid #555", borderRight: "2px solid #555" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, width: 12, height: 12, borderBottom: "2px solid #555", borderLeft: "2px solid #555" }} />
        <div style={{ position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderBottom: "2px solid #555", borderRight: "2px solid #555" }} />

        {/* Main countdown */}
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: isMobile ? 48 : 80,
            fontWeight: 600,
            color: "#ff4444",
            letterSpacing: -2,
            lineHeight: 1,
            textShadow: "0 0 20px rgba(255,68,68,0.6), 0 0 40px rgba(255,68,68,0.3), 0 0 80px rgba(255,68,68,0.15)",
            fontVariantNumeric: "tabular-nums",
            marginBottom: 16,
            textAlign: "center"
          }}
        >
          {countdown.yrs} YRS {countdown.days} DAYS
        </div>

        {/* H:M:S */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "center",
            gap: 4,
            marginBottom: 40,
          }}
        >
          {[countdown.hh, countdown.mm, countdown.ss].map((unit, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-end", gap: 4 }}>
              <div style={{ textAlign: "center", background: "#0d0d0d", border: "1px solid #1a1a1a", padding: "12px 16px", borderRadius: 2 }}>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: isMobile ? 24 : 36,
                    color: "#ffffff",
                    fontVariantNumeric: "tabular-nums",
                    textShadow: "0 0 12px rgba(255,255,255,0.4)",
                    lineHeight: 1,
                  }}
                >
                  {unit}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 16,
                    color: "#a0a0a0",
                    letterSpacing: 4,
                    textTransform: "uppercase",
                    marginTop: 8,
                  }}
                >
                  {["HOURS", "MINUTES", "SECONDS"][i]}
                </div>
              </div>
              {i < 2 && (
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 22,
                    color: "#555555",
                    padding: "0 8px",
                    paddingBottom: 20,
                  }}
                >
                  :
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Budget consumed bar */}
        <div style={{ width: "100%", maxWidth: 600 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                color: "#a0a0a0",
                letterSpacing: 3,
                textTransform: "uppercase",
              }}
            >
              GLOBAL BUDGET CONSUMED
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 16,
                color: "#ff4444",
                fontWeight: 700,
                letterSpacing: 1,
              }}
            >
              77.3% DEPLETED
            </span>
          </div>
          {/* Skipped ProgressBar replacement here to prevent visual differences (custom gradient and height) */}
          <div className="progress-track" style={{ height: 4, background: "#111111", border: "1px solid #222" }}>
            <div
              style={{
                height: "100%",
                width: "77.3%",
                background: "linear-gradient(to right, #00cc66, #ffaa00, #ff4444)",
                boxShadow: "0 0 10px rgba(255, 68, 68, 0.5)"
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 24 }}>
        {/* Personal impact */}
        {/* Skipped Panel replacement here to prevent visual differences (custom border-left color, background and height) */}
        <div className="intel-box" style={{ background: "#050505", border: "1px solid #1a1a1a", borderLeft: "2px solid #ffaa00", height: "100%" }}>
          <div className="intel-label" style={{ color: "#ffaa00" }}>PERSONAL DECAY RATE</div>
          <div className="intel-text" style={{ color: "#ffffff", fontSize: 13, lineHeight: 1.6 }}>
            {auditDone && totalBurnRate > 0
              ? `YOUR ACTIVITIES CONSUME ${formatBurnRate(totalBurnRate)} FROM THE GLOBAL BUDGET.`
              : "COMPLETE THE PERSONAL AUDIT TO SEE YOUR INDIVIDUAL IMPACT ON THIS COUNTDOWN."}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <button
            className="btn-primary"
            onClick={onGoToAudit}
            style={{
              width: "100%",
              padding: "20px 0",
              fontSize: 16,
              letterSpacing: 4,
              boxShadow: "0 0 20px rgba(255, 68, 68, 0.2)"
            }}
            aria-label="Enter Audit Mode"
          >
            ENTER AUDIT MODE ›
          </button>
        </div>
      </div>
    </div>
  );
}
