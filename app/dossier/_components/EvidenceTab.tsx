"use client";

const EVIDENCE_BARS = [
  { label: "TRANSPORT", pct: 78, color: "#ff4444" },
  { label: "ENERGY", pct: 85, color: "#ff4444" },
  { label: "INDUSTRY", pct: 62, color: "#ffaa00" },
  { label: "WASTE", pct: 45, color: "#ffaa00" },
  { label: "AGRICULTURE", pct: 28, color: "#00cc6644" },
  { label: "BUILDINGS", pct: 55, color: "#ffaa00" },
];

interface EvidenceTabProps {
  isMobile: boolean;
  barsVisible: boolean;
  onNext: () => void;
}

export function EvidenceTab({ isMobile, barsVisible, onNext }: EvidenceTabProps) {
  return (
    <div style={{ padding: isMobile ? "16px" : "24px 28px", overflowY: "auto", flex: 1, maxWidth: "100%", overflowX: "hidden", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Top Header Section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "1px solid #ff444433", paddingBottom: 12 }}>
        <div>
          <div className="doc-label" style={{ color: "#ff4444", marginBottom: 4 }}>
            ███████ CLASSIFIED INTELLIGENCE
          </div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: isMobile ? 18 : 24, fontWeight: 600, color: "#ffffff", letterSpacing: 2, textTransform: "uppercase" }}>
            SECTORAL EMISSION TELEMETRY
          </div>
        </div>
        {!isMobile && (
          <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 16, color: "#bbbbbb", lineHeight: 1.6 }}>
            STATUS: <span style={{ color: "#ff4444" }}>ACTIVE MONITORING</span><br />
            ENCRYPTION: <span style={{ color: "#a0a0a0" }}>AES-256-GCM</span>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", gap: 24 }}>

        {/* Left Column: The Bars */}
        <div style={{ border: "1px solid #1a1a1a", background: "#080808", padding: 20, position: "relative" }}>
          {/* Corner brackets */}
          <div style={{ position: "absolute", top: 0, left: 0, width: 8, height: 8, borderTop: "2px solid #555", borderLeft: "2px solid #555" }} />
          <div style={{ position: "absolute", top: 0, right: 0, width: 8, height: 8, borderTop: "2px solid #555", borderRight: "2px solid #555" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, width: 8, height: 8, borderBottom: "2px solid #555", borderLeft: "2px solid #555" }} />
          <div style={{ position: "absolute", bottom: 0, right: 0, width: 8, height: 8, borderBottom: "2px solid #555", borderRight: "2px solid #555" }} />

          <div className="doc-label" style={{ marginBottom: 24, color: "#a0a0a0", borderBottom: "1px dotted #333", paddingBottom: 8 }}>
            // REAL-TIME CATEGORY BREAKDOWN
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {EVIDENCE_BARS.map((bar, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, color: "#e0e0e0", letterSpacing: 2 }}>{bar.label}</span>
                  {/* Skipped StatusBadge replacement here to prevent visual differences */}
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, color: bar.color, letterSpacing: 1, textShadow: `0 0 8px ${bar.color}44` }}>{bar.pct}%</span>
                </div>
                {/* Skipped ProgressBar replacement here to prevent visual differences from the segmented bar */}
                {/* Advanced Segmented Bar */}
                <div style={{ display: "flex", height: 6, gap: 2, background: "#0a0a0a", border: "1px solid #111", padding: 1 }}>
                  {Array.from({ length: 40 }).map((_, segmentIdx) => {
                    const threshold = (segmentIdx / 40) * 100;
                    const isActive = threshold < (barsVisible ? bar.pct : 0);
                    return (
                      <div
                        key={segmentIdx}
                        style={{
                          flex: 1,
                          background: isActive ? bar.color : "#111111",
                          opacity: isActive ? 0.8 : 0.3,
                          transition: "background 0.2s ease",
                          transitionDelay: `${i * 100 + segmentIdx * 10}ms`
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Key Findings & Raw Data */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Key finding */}
          {/* Skipped Panel replacement here to prevent visual differences (custom border-left color and inline styles) */}
          <div className="intel-box" style={{ background: "rgba(255, 68, 68, 0.05)", borderLeft: "2px solid #ff4444" }}>
            <div className="intel-label" style={{ color: "#ff4444" }}>
              <span className="live-dot" style={{ width: 6, height: 6 }} /> CRITICAL FINDING
            </div>
            <div className="intel-text" style={{ color: "#f4f4f4", fontSize: 16 }}>
              Energy generation and transport account for the majority of regional carbon output. Immediate intervention in these sectors yields the highest timeline extension potential.
            </div>
          </div>

          {/* Raw Telemetry feed simulation */}
          <div style={{ border: "1px solid #1a1a1a", padding: 16, background: "#050505", flex: 1, display: "flex", flexDirection: "column" }}>
            <div className="doc-label" style={{ marginBottom: 12, color: "#666" }}>
              // LIVE SENSOR FEED
            </div>
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: 16,
              color: "#ffaa0088",
              display: "flex",
              flexDirection: "column",
              gap: 4,
              overflow: "hidden"
            }}>
              {["0x8F9A2 RECV 45.2MT", "0x11B4C DROP -2.1MT", "0xAA99E WARN: THRESHOLD", "0x55B12 SYNC OK", "0x22F09 RECV 18.9MT", "0x77C31 ANALYZING..."].map((line, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{line}</span>
                  <span style={{ color: "#444" }}>{(Math.random() * 1000).toFixed(0)}ms</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16, borderTop: "1px solid #1a1a1a", paddingTop: 24 }}>
        <div className="doc-label" style={{ marginBottom: 12, color: "#666" }}>
          // METHODOLOGY // CLASSIFIED CALCULATION PROTOCOLS
        </div>
        <details style={{ background: "#050505", border: "1px solid #1a1a1a", marginBottom: 8 }}>
          <summary style={{ padding: "12px 16px", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 13, color: "#bbbbbb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>[+] TRANSPORTATION PROTOCOL</span>
          </summary>
          <div style={{ padding: "0 16px 16px 16px", fontFamily: "var(--font-sans)", fontSize: 13, color: "#888", lineHeight: 1.6 }}>
            Employs distance-to-emission ratios based on regional combustion averages. EV multipliers apply a 0.2x coefficient, while high-frequency air travel incurs an exponential penalty.
          </div>
        </details>
        <details style={{ background: "#050505", border: "1px solid #1a1a1a", marginBottom: 8 }}>
          <summary style={{ padding: "12px 16px", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 13, color: "#bbbbbb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>[+] DIETARY EMISSION PROTOCOL</span>
          </summary>
          <div style={{ padding: "0 16px 16px 16px", fontFamily: "var(--font-sans)", fontSize: 13, color: "#888", lineHeight: 1.6 }}>
            Calculates methane and supply-chain logistics. Red meat consumption adds a compound multiplier due to land-use footprint, while local supply chains reduce freight transport overhead.
          </div>
        </details>
        <details style={{ background: "#050505", border: "1px solid #1a1a1a", marginBottom: 8 }}>
          <summary style={{ padding: "12px 16px", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 13, color: "#bbbbbb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>[+] ENERGY INFRASTRUCTURE PROTOCOL</span>
          </summary>
          <div style={{ padding: "0 16px 16px 16px", fontFamily: "var(--font-sans)", fontSize: 13, color: "#888", lineHeight: 1.6 }}>
            Assesses HVAC baseload and local grid intensity. Solar integrations offset raw burn rates by up to 200s/day, while unregulated cooling drastically accelerates timeline decay.
          </div>
        </details>
        <details style={{ background: "#050505", border: "1px solid #1a1a1a", marginBottom: 8 }}>
          <summary style={{ padding: "12px 16px", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 13, color: "#bbbbbb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>[+] CONSUMPTION & WASTE PROTOCOL</span>
          </summary>
          <div style={{ padding: "0 16px 16px 16px", fontFamily: "var(--font-sans)", fontSize: 13, color: "#888", lineHeight: 1.6 }}>
            Tracks hardware refresh cycles and single-use plastics against landfill degradation curves. Segregated waste and circular practices yield timeline recovery points.
          </div>
        </details>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "auto", paddingTop: 20 }}>
        <button
          className="btn-ghost"
          onClick={onNext}
          style={{ width: isMobile ? "100%" : "auto", padding: "12px 32px" }}
          aria-label="Next step: Timeline"
        >
          NEXT ›
        </button>
      </div>
    </div>
  );
}
