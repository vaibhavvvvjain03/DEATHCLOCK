"use client";
import { CATEGORY_KEYS, QUESTION_BANK } from "@/lib/questions";
import { ClimateProfile } from "@/lib/memory-service";

interface ArchiveTabProps {
  isMobile: boolean;
  profile: ClimateProfile | null;
}

export function ArchiveTab({ isMobile, profile }: ArchiveTabProps) {
  const recoverySources: { category: string; delta: number }[] = [];
  let behaviorChanges: string[] = [];

  if (profile && profile.pastInvestigations && profile.pastInvestigations.length > 0) {
    const lastInv = profile.pastInvestigations[profile.pastInvestigations.length - 1];

    CATEGORY_KEYS.forEach(key => {
      const oldScore = lastInv.categoryScores?.[key] || 0;
      const newScore = profile.categoryScores?.[key] || 0;
      const delta = oldScore - newScore;
      if (delta > 0) {
        recoverySources.push({ category: key.toUpperCase(), delta });
      }
    });
    recoverySources.sort((a, b) => b.delta - a.delta);

    if (lastInv.answers && profile.answers) {
      CATEGORY_KEYS.forEach(key => {
        QUESTION_BANK[key].forEach(q => {
          const oldVal = lastInv.answers![q.id];
          const newVal = profile.answers[q.id];
          if (oldVal && newVal && oldVal !== newVal) {
            const oldOpt = q.options.find(o => o.value === oldVal);
            const newOpt = q.options.find(o => o.value === newVal);
            if (oldOpt && newOpt && newOpt.burnRate < oldOpt.burnRate) {
              let phrase = q.question + " IMPROVED";
              if (q.id === "mov_2") phrase = "COMMUTE DISTANCE REDUCED";
              if (q.id === "mov_1" && newVal === "public_transit") phrase = "PUBLIC TRANSIT USAGE INCREASED";
              if (q.id === "food_2") phrase = "RED MEAT CONSUMPTION REDUCED";
              if (q.id === "home_2" || q.id === "home_4") phrase = "HOME ENERGY EFFICIENCY IMPROVED";
              if (q.id === "mov_3") phrase = "FLIGHT FREQUENCY REDUCED";
              if (q.id === "food_4") phrase = "FOOD WASTE REDUCED";
              if (q.id === "cons_1") phrase = "APPAREL ACQUISITION REDUCED";
              if (q.id === "cons_4") phrase = "SINGLE-USE PLASTIC REDUCED";
              behaviorChanges.push(phrase);
            }
          }
        });
      });
      behaviorChanges = Array.from(new Set(behaviorChanges));
    }
  }

  return (
    <div style={{ padding: isMobile ? "16px" : "24px 28px", overflowY: "auto", flex: 1, maxWidth: "100%", overflowX: "hidden", display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "1px solid #00cc6633", paddingBottom: 12 }}>
        <div>
          <div className="doc-label" style={{ color: "#00cc66", marginBottom: 4 }}>
            ███████ INTELLIGENCE BUREAU MEMORY SYSTEM
          </div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: isMobile ? 18 : 24, fontWeight: 600, color: "#ffffff", letterSpacing: 2, textTransform: "uppercase" }}>
            ARCHIVE
          </div>
        </div>
      </div>

      {!profile || !profile.pastInvestigations || profile.pastInvestigations.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center", marginTop: 40 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, color: "#ffffff", letterSpacing: 2, textAlign: "center" }}>
            NO ARCHIVED INVESTIGATIONS FOUND FOR THIS SUBJECT.
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "#ffffff", letterSpacing: 1, textAlign: "center", maxWidth: 450, lineHeight: 1.6 }}>
            SUBJECT IS CURRENTLY ON THEIR FIRST INVESTIGATION. RETURN FOR A SECOND AUDIT AT A LATER DATE TO UNLOCK COMPARATIVE ANALYSIS AND TIMELINE IMPROVEMENT METRICS.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            <div style={{ background: "#050505", border: "1px solid #1a1a1a", borderLeft: "3px solid #00cc66", padding: 20 }}>
              <div className="doc-label" style={{ color: "#ffffff", marginBottom: 12 }}>LAST INVESTIGATION</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, color: "#ffffff", letterSpacing: 1 }}>
                {new Date(profile.pastInvestigations[profile.pastInvestigations.length - 1].completionDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, color: "#eeeeee", marginTop: 4 }}>
                CITY: {profile.pastInvestigations[profile.pastInvestigations.length - 1].city.toUpperCase()}
              </div>
            </div>

            <div style={{ background: "#050505", border: "1px solid #1a1a1a", borderLeft: "3px solid #ffaa00", padding: 20 }}>
              <div className="doc-label" style={{ color: "#ffffff", marginBottom: 12 }}>PREVIOUS BURN RATE</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, color: "#ffaa00", fontVariantNumeric: "tabular-nums" }}>
                -{profile.pastInvestigations[profile.pastInvestigations.length - 1].burnRate.toLocaleString()}s <span style={{ fontSize: 16 }}>/ DAY</span>
              </div>
            </div>
          </div>

          <div style={{ border: "1px solid #1a1a1a", padding: 24, background: "#080808" }}>
            <div className="doc-label" style={{ color: "#ffffff", marginBottom: 20 }}>CURRENT PROGRESS ANALYSIS</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, color: "#eeeeee" }}>CURRENT BURN RATE</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, color: "#ff4444" }}>-{profile.personalBurnRate.toLocaleString()}s / DAY</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid #1a1a1a" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, color: "#eeeeee" }}>TIMELINE IMPROVEMENT</span>
              {profile.pastInvestigations[profile.pastInvestigations.length - 1].burnRate - profile.personalBurnRate > 0 ? (
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, color: "#00cc66" }}>
                  +{(profile.pastInvestigations[profile.pastInvestigations.length - 1].burnRate - profile.personalBurnRate).toLocaleString()}s / DAY
                </span>
              ) : (
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, color: "#ff4444" }}>
                  {(profile.pastInvestigations[profile.pastInvestigations.length - 1].burnRate - profile.personalBurnRate).toLocaleString()}s / DAY
                </span>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid #1a1a1a", marginTop: 12 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, color: "#eeeeee" }}>CARBON THREAT REDUCTION</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, color: "#00cc66" }}>
                {Math.max(0, ((profile.pastInvestigations[profile.pastInvestigations.length - 1].burnRate - profile.personalBurnRate) / profile.pastInvestigations[profile.pastInvestigations.length - 1].burnRate) * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {recoverySources.length > 0 && (
            <div style={{ border: "1px solid #1a1a1a", padding: 24, background: "#050505" }}>
              <div className="doc-label" style={{ color: "#ffffff", marginBottom: 20 }}>RECOVERY SOURCE BREAKDOWN</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {recoverySources.map((rs, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #333", paddingBottom: 8 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "#eeeeee" }}>{rs.category}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "#00cc66" }}>+{rs.delta.toLocaleString()}s/day recovered</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {behaviorChanges.length > 0 && (
            <div style={{ border: "1px solid #1a1a1a", padding: 24, background: "#050505", borderLeft: "3px solid #00cc66" }}>
              <div className="doc-label" style={{ color: "#00cc66", marginBottom: 16 }}>BEHAVIOR CHANGE DETECTED</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {behaviorChanges.map((bc, i) => (
                  <div key={i} style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "#ffffff", letterSpacing: 1 }}>
                    {bc}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ border: "1px solid #1a1a1a", padding: 24, background: "#050505" }}>
            <div className="doc-label" style={{ color: "#ffffff", marginBottom: 20 }}>INVESTIGATION HISTORY</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {(() => {
                const history = [...profile.pastInvestigations, {
                  id: `INV-${String(profile.totalInvestigations).padStart(3, '0')}`,
                  city: profile.city,
                  burnRate: profile.personalBurnRate,
                  categoryScores: profile.categoryScores,
                  completionDate: profile.auditCompletionDate || profile.lastVisitDate
                }].sort((a, b) => new Date(b.completionDate).getTime() - new Date(a.completionDate).getTime());

                return history.map((inv, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8, borderBottom: i < history.length - 1 ? "1px solid #1a1a1a" : "none", paddingBottom: i < history.length - 1 ? 16 : 0 }}>
                    <div className="doc-label" style={{ color: "#eeeeee" }}>INVESTIGATION #{inv.id.split('-')[1]}</div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#dddddd" }}>DATE:</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#ffffff" }}>{new Date(inv.completionDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }).toUpperCase()}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#dddddd" }}>BURN RATE:</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#ff4444" }}>-{inv.burnRate.toLocaleString()}s/day</span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1, border: "1px solid #1a1a1a", padding: 16, textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, color: "#00cc66", marginBottom: 8 }}>
                {profile.missions.filter(m => m.status === "completed").length}
              </div>
              <div className="doc-label" style={{ color: "#eeeeee" }}>MISSIONS COMPLETED</div>
            </div>
            <div style={{ flex: 1, border: "1px solid #1a1a1a", padding: 16, textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, color: "#00cc66", marginBottom: 8 }}>
                +{profile.missions.filter(m => m.status === "completed").reduce((sum, m) => sum + m.secondsBack, 0).toLocaleString()}s
              </div>
              <div className="doc-label" style={{ color: "#eeeeee" }}>EXTENSION EARNED</div>
            </div>
          </div>

          {/* Intelligence Explanation Engine */}
          <div style={{ marginTop: 8, border: "1px dashed #333", padding: 16, background: "#050505" }}>
            <div className="doc-label" style={{ color: "#ffffff", marginBottom: 12 }}>INTELLIGENCE EXPLANATION ENGINE</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <span style={{ color: "#00cc66", fontFamily: "var(--font-mono)", fontSize: 13 }}>BURN RATE DEFINED: </span>
                <span style={{ color: "#ffffff", fontFamily: "var(--font-mono)", fontSize: 13 }}>The exact number of seconds your actions are accelerating the region's carbon decay per day.</span>
              </div>
              <div>
                <span style={{ color: "#00cc66", fontFamily: "var(--font-mono)", fontSize: 13 }}>TIMELINE IMPROVEMENT: </span>
                <span style={{ color: "#ffffff", fontFamily: "var(--font-mono)", fontSize: 13 }}>Calculated by subtracting your current audit burn rate from your historical burn rate. Positive numbers indicate a slowdown in decay.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
