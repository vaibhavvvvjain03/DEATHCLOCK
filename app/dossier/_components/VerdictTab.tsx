/**
 * VERDICT TAB
 * Shows the completed audit outcome: daily/weekly burn rate summary grid,
 * category breakdown bars, a Gemini-generated agent analysis (when a prior
 * investigation exists), clickable mission cards, and a threat-evolution
 * report. Exports a shareable canvas verdict card.
 */
"use client";
import { CATEGORY_NAMES, QUESTION_BANK, CATEGORY_KEYS } from "@/lib/questions";
import { motion, AnimatePresence } from "framer-motion";
import { MissionRecord, ClimateProfile } from "@/lib/memory-service";

function getThreatLevel(burnRate: number): string {
  if (burnRate > 8000) return "OMEGA-0 TERMINAL";
  if (burnRate > 5000) return "ALPHA-1 CRITICAL";
  if (burnRate > 2000) return "BETA-2 CONCERNING";
  if (burnRate > 500) return "GAMMA-3 ELEVATED";
  return "DELTA-4 STABLE";
}

interface VerdictTabProps {
  city: string;
  isMobile: boolean;
  totalBurnRate: number;
  missions: MissionRecord[];
  loadingSwaps: boolean;
  floatingRestore: { id: string; seconds: number; key: number } | null;
  answers: Record<string, string>;
  catKeys: readonly string[];
  profile: ClimateProfile | null;
  handleCommit: (mission: MissionRecord, idx: number) => void;
  generateShareCard: () => void;
  onGoToArchive: () => void;
}

export function VerdictTab({
  city,
  isMobile,
  totalBurnRate,
  missions,
  loadingSwaps,
  floatingRestore,
  answers,
  catKeys,
  profile,
  handleCommit,
  generateShareCard,
  onGoToArchive,
}: VerdictTabProps) {
  const topReductions: { name: string; delta: number; pct: number }[] = [];
  let totalRecovery = 0;
  const prevInv = profile?.pastInvestigations?.[profile.pastInvestigations.length - 1];

  if (prevInv && prevInv.categoryScores) {
    const currentScores = profile?.categoryScores || {};
    Object.keys(currentScores).forEach(key => {
      const prev = prevInv.categoryScores[key] || 0;
      const curr = currentScores[key];
      const delta = prev - curr;
      if (delta > 0) {
        const idx = catKeys.indexOf(key as (typeof CATEGORY_KEYS)[number]);
        topReductions.push({
          name: CATEGORY_NAMES[idx] || key,
          delta,
          pct: prev > 0 ? (delta / prev) * 100 : 100
        });
        totalRecovery += delta;
      }
    });
    topReductions.sort((a, b) => b.delta - a.delta);
  }

  const currentThreat = getThreatLevel(totalBurnRate);
  const prevThreat = prevInv ? getThreatLevel(prevInv.burnRate) : null;

  return (
    <div style={{ padding: isMobile ? "16px" : "24px 28px", overflowY: "auto", flex: 1, position: "relative", maxWidth: "100%", overflowX: "hidden" }}>
      {/* Floating restore animation */}
      <AnimatePresence>
        {floatingRestore && (
          <motion.div
            key={floatingRestore.key}
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -60 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{
              position: "fixed",
              bottom: 120,
              left: "50%",
              transform: "translateX(-50%)",
              fontFamily: "var(--font-mono)",
              fontSize: 16,
              fontWeight: 700,
              color: "#00cc66",
              pointerEvents: "none",
              zIndex: 9500,
              whiteSpace: "nowrap",
            }}
          >
            +{floatingRestore.seconds.toLocaleString()} SECONDS RESTORED
          </motion.div>
        )}
      </AnimatePresence>

      <div className="doc-label" style={{ marginBottom: 12, color: "#999999" }}>
        PERSONAL VERDICT // {city.toUpperCase()}
      </div>

      {/* Summary grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
          gap: 1,
          background: "#1e1e1e",
          marginBottom: 16,
        }}
      >
        {[
          { label: "DAILY BURN", value: totalBurnRate > 0 ? `-${totalBurnRate.toLocaleString()}s` : "—" },
          { label: "WEEKLY BURN", value: totalBurnRate > 0 ? `-${(totalBurnRate * 7).toLocaleString()}s` : "—" },
          { label: "IMPACT CLASS", value: currentThreat.split(" ")[0], color: totalBurnRate > 5000 ? "#ff4444" : totalBurnRate > 2000 ? "#ffaa00" : "#00cc66" },
        ].map((cell, i) => (
          /* Skipped DataField replacement here to prevent visual differences */
          <div key={i} style={{ background: "#0d0d0d", padding: 12, border: "1px solid #1e1e1e" }}>
            <div className="doc-label" style={{ marginBottom: 6 }}>{cell.label}</div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 16,
                fontWeight: 700,
                color: "#ff4444",
                fontVariantNumeric: "tabular-nums",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {cell.value}
            </div>
          </div>
        ))}
      </div>

      {/* Agent Analysis Report */}
      {topReductions.length > 0 && (
        <div style={{ marginBottom: 20, border: "1px solid #1a1a1a", padding: 16, background: "#050505" }}>
          <div className="doc-label" style={{ marginBottom: 12, color: "#00cc66" }}>AGENT ANALYSIS</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "#dddddd", lineHeight: 1.6 }}>
            Your greatest reduction originated from {topReductions[0].name.toLowerCase()}.
            <br /><br />
            {topReductions.map(r => (
              <span key={r.name}>
                {r.name} emissions decreased by {Math.round(r.pct)}%.<br />
              </span>
            ))}
            <br />
            Combined interventions generated a timeline recovery of {totalRecovery.toLocaleString()} seconds.
            <br />
            <span style={{ color: "#00cc66", marginTop: 8, display: "block" }}>
              {prevThreat && currentThreat !== prevThreat
                ? `Threat classification downgraded from ${prevThreat} to ${currentThreat}.`
                : "Threat progression has slowed significantly."}
            </span>
          </div>
        </div>
      )}

      {/* Category breakdown bars */}
      <div style={{ marginBottom: 20 }}>
        <div className="doc-label" style={{ marginBottom: 12, color: "#dddddd" }}>CATEGORY BREAKDOWN</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {CATEGORY_NAMES.map((name, i) => {
            const catKey = catKeys[i];
            const catAnswers = QUESTION_BANK[catKey as keyof typeof QUESTION_BANK].map((q) => {
              const answered = q.options.find((o) => o.value === answers[q.id]);
              return answered?.burnRate || 0;
            });
            const catTotal = catAnswers.reduce((s, v) => s + Math.max(0, v), 0);
            const maxPossible = 3000;
            const pct = Math.min(100, (catTotal / maxPossible) * 100);
            const color = pct > 66 ? "#ff4444" : pct > 33 ? "#ffaa00" : "#00cc6666";

            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 16,
                    color: "#dddddd",
                    width: 100,
                    flexShrink: 0,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                  }}
                >
                  {name}
                </span>
                {/* Skipped ProgressBar and StatusBadge replacements to prevent visual differences */}
                <div className="cat-bar-track">
                  <div
                    className="cat-bar-fill"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 16,
                    color,
                    width: 32,
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  {Math.round(pct)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mission cards */}
      <div className="doc-label" style={{ marginBottom: 12, color: "#dddddd" }}>MISSION EFFECTIVENESS REPORT</div>

      {loadingSwaps ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="spinner" style={{ width: 14, height: 14, border: "2px solid #ff4444", borderTopColor: "transparent", borderRadius: "50%" }} />
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 16,
                color: "#ff4444",
                letterSpacing: 3,
              }}
            >
              GENERATING INTELLIGENCE...
            </div>
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              color: "#eeeeee",
              letterSpacing: 2,
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginLeft: 26
            }}
          >
            ✦ POWERED BY GEMINI AI
          </div>
        </div>
      ) : missions.length === 0 ? (
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            color: "#2a2a2a",
            letterSpacing: 2,
          }}
        >
          COMPLETE AUDIT TO UNLOCK MISSIONS
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {missions.map((mission, idx) => {
            const isCompleted = mission.status === "completed";
            return (
              /* Skipped MissionCard replacement here to prevent visual differences (missing idx in MissionCard signature) */
              <div
                key={idx}
                onClick={() => handleCommit(mission, idx)}
                style={{
                  border: `1px solid ${isCompleted ? "#00cc6655" : "#1e1e1e"}`,
                  borderRadius: 2,
                  padding: 14,
                  background: isCompleted ? "#00cc660a" : "#050505",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  transition: "all 0.2s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.borderColor = isCompleted ? "#00cc66" : "#333";
                  el.style.background = isCompleted ? "#00cc661a" : "#1a1a1a";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.borderColor = isCompleted ? "#00cc6655" : "#1e1e1e";
                  el.style.background = isCompleted ? "#00cc660a" : "#050505";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #1a1a1a", paddingBottom: 8 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "#aaaaaa" }}>MISSION-{String(idx + 1).padStart(3, "0")}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "#ffffff" }}>{mission.action}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#888" }}>STATUS:</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: isCompleted ? "#00cc66" : "#ffaa00" }}>{isCompleted ? "Completed" : "In Progress"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#888" }}>ESTIMATED IMPACT:</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#00cc66" }}>+{mission.secondsBack.toLocaleString()}s</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FINAL BUREAU ASSESSMENT & THREAT EVOLUTION */}
      <div style={{ marginTop: 24, marginBottom: 24, padding: 16, border: "1px dashed #ff4444", background: "rgba(255, 68, 68, 0.05)" }}>
        <div className="doc-label" style={{ marginBottom: 12, color: "#ff4444" }}>FINAL BUREAU ASSESSMENT</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "#dddddd", lineHeight: 1.6 }}>
          {prevInv ? (
            <>
              {topReductions.length > 0 ? (
                <>Subject demonstrates measurable reduction in {topReductions[0].name.toLowerCase()} emissions.<br /><br /></>
              ) : null}
              {totalRecovery > 0 ? (
                <>
                  Combined interventions reduced carbon threat by {((totalRecovery / prevInv.burnRate) * 100).toFixed(1)}%.<br /><br />
                  Timeline recovery achieved:<br />
                  <span style={{ color: "#00cc66" }}>+{totalRecovery.toLocaleString()} seconds/day</span><br /><br />
                </>
              ) : null}

              <div style={{ borderLeft: "2px solid #333", paddingLeft: 12, margin: "12px 0", background: "#050505", padding: "12px 12px 12px 16px" }}>
                <span style={{ color: "#888", fontSize: 12, letterSpacing: 1 }}>THREAT EVOLUTION REPORT</span><br />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  <span style={{ color: "#aaa" }}>INITIAL THREAT</span>
                  <span style={{ color: prevThreat?.includes("ALPHA") ? "#ff4444" : prevThreat?.includes("BETA") ? "#ffaa00" : "#00cc66" }}>{prevThreat}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  <span style={{ color: "#aaa" }}>CURRENT THREAT</span>
                  <span style={{ color: currentThreat.includes("ALPHA") ? "#ff4444" : currentThreat.includes("BETA") ? "#ffaa00" : "#00cc66" }}>{currentThreat}</span>
                </div>
                {totalRecovery > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, borderTop: "1px solid #333", paddingTop: 8 }}>
                    <span style={{ color: "#00cc66" }}>STATUS</span>
                    <span style={{ color: "#00cc66" }}>INTERVENTION SUCCESSFUL</span>
                  </div>
                )}
              </div>

              Recommendation:<br />
              Continue mission compliance and return for reassessment after significant behavioral changes.
            </>
          ) : (
            <>
              THREAT TO REGION: <span style={{ color: "#ffffff" }}>{city.toUpperCase()}</span><br />
              IMPACT CLASS: <span style={{ color: currentThreat.includes("ALPHA") ? "#ff4444" : currentThreat.includes("BETA") ? "#ffaa00" : "#00cc66" }}>{currentThreat}</span><br /><br />
              RECOMMENDED ACTION: Execution of pending missions mandatory to reverse timeline decay. Return for reassessment after intervention protocols.
            </>
          )}
        </div>
      </div>

      {/* Broadcast button */}
      <button
        className="btn-primary"
        style={{ width: "100%", marginTop: 8 }}
        onClick={generateShareCard}
        aria-label="Broadcast Verdict"
      >
        BROADCAST VERDICT
      </button>
      <button
        className="btn-secondary"
        style={{ width: "100%", marginTop: 8, background: "transparent", border: "1px solid #333", color: "#e0e0e0", padding: "16px", fontFamily: "var(--font-mono)", letterSpacing: 2 }}
        onClick={onGoToArchive}
        aria-label="View Archived Intelligence"
      >
        VIEW ARCHIVED INTELLIGENCE
      </button>
    </div>
  );
}
