/**
 * AUDIT TAB
 * Renders the multi-category personal carbon audit questionnaire embedded
 * within the dossier. Handles briefing screen, loading/done states, a
 * category-transition overlay, per-question option buttons with processing
 * feedback, and category-dot progress indicators.
 */
"use client";
import { CATEGORY_NAMES, QUESTION_BANK } from "@/lib/questions";
import { motion, AnimatePresence } from "framer-motion";
import { MissionRecord } from "@/lib/memory-service";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionLabel } from "@/components/ui/SectionLabel";

interface AuditTabProps {
  isMobile: boolean;
  showBriefing: boolean;
  setShowBriefing: (v: boolean) => void;
  loadingSwaps: boolean;
  auditDone: boolean;
  currentQ: { id: string; question: string; options: { value: string; label: string; burnRate: number }[] } | undefined;
  catIdx: number;
  qIdx: number;
  catKeys: readonly string[];
  totalBurnRate: number;
  totalQs: number;
  transitioning: boolean;
  transitionText: string;
  processingQ: boolean;
  processingLines: string[];
  handleAnswer: (optionValue: string, burnRate: number) => void;
  resetAudit: () => void;
  onGoToVerdict: () => void;
}

export function AuditTab({
  isMobile,
  showBriefing,
  setShowBriefing,
  loadingSwaps,
  auditDone,
  currentQ,
  catIdx,
  qIdx,
  catKeys,
  totalBurnRate,
  totalQs,
  transitioning,
  transitionText,
  processingQ,
  processingLines,
  handleAnswer,
  resetAudit,
  onGoToVerdict,
}: AuditTabProps) {
  if (showBriefing && catIdx === 0 && qIdx === 0) {
    return (
      <div style={{ flex: 1, padding: isMobile ? "24px 16px" : "40px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <SectionLabel>PERSONAL CLIMATE ASSESSMENT</SectionLabel>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "#dddddd", lineHeight: 1.6, marginBottom: 24 }}>
          This assessment contains 30 intelligence checkpoints.
          <br /><br />
          The Bureau will evaluate:
          <ul style={{ margin: "16px 0", paddingLeft: 20, color: "#bbbbbb" }}>
            <li>Transportation activity</li>
            <li>Food consumption patterns</li>
            <li>Residential energy usage</li>
            <li>Consumer behavior</li>
            <li>Waste generation</li>
            <li>Occupational impact</li>
          </ul>
          Responses will be used to generate a personalized carbon intelligence profile.
          <br /><br />
          <span style={{ color: "#ff4444" }}>Estimated completion time: 2–3 minutes.</span>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowBriefing(false)}
          style={{ padding: "16px", fontSize: 16, letterSpacing: 3 }}
          aria-label="Commence Audit"
        >
          COMMENCE AUDIT
        </button>
      </div>
    );
  }

  if (loadingSwaps) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 12,
          padding: 32,
        }}
      >
        <div className="live-dot" style={{ width: 8, height: 8 }} />
        {["PROCESSING AUDIT DATA...", "ANALYZING BEHAVIOR PATTERNS...", "CALCULATING OPTIMAL SWAPS...", "GENERATING INTELLIGENCE REPORT..."].map((t, i) => (
          <div
            key={i}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              color: i === 0 ? "#ff4444" : "#1a1a1a",
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            {t}
          </div>
        ))}
      </div>
    );
  }

  if (auditDone) {
    return (
      <div style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div
          style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#00cc66", letterSpacing: 3, marginBottom: 12 }}
        >
          ✓ AUDIT COMPLETE
        </div>
        <button className="btn-ghost" onClick={onGoToVerdict} aria-label="View Verdict">
          VIEW VERDICT ›
        </button>
      </div>
    );
  }

  if (!currentQ) return null;

  const catName = CATEGORY_NAMES[catIdx];
  const qNumber = catKeys.slice(0, catIdx).reduce((s, k) => s + QUESTION_BANK[k as keyof typeof QUESTION_BANK].length, 0) + qIdx + 1;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
      {/* Category transition overlay */}
      <AnimatePresence>
        {transitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: "absolute",
              inset: 0,
              background: "#000",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: 12,
              zIndex: 100,
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 20,
                color: "#ffffff",
                fontWeight: 500,
              }}
            >
              ✓ SECTION COMPLETE
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 16,
                color: "#333",
                letterSpacing: 3,
              }}
            >
              {transitionText}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ padding: isMobile ? "16px" : "20px 28px" }}>
        {/* Header row */}
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
              fontSize: 16,
              color: "#999999",
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            PERSONAL AUDIT // {catName}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button
              onClick={resetAudit}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 16,
                color: "#ff4444",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                letterSpacing: 2,
                textDecoration: "underline",
              }}
              aria-label="Restart Audit"
            >
              [ RESTART AUDIT ]
            </button>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 16,
                color: "#555555",
                letterSpacing: 2,
              }}
            >
              Q {qNumber}/{totalQs}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <ProgressBar percent={(qNumber / totalQs) * 100} />

        {/* Category tag */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              width: 10,
              height: 1,
              background: "#ff4444",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 16,
              color: "#ff4444",
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            {catName}
          </span>
        </div>

        {/* Question text */}
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: isMobile ? 16 : 20,
            fontWeight: 500,
            color: "#ffffff",
            lineHeight: 1.5,
            maxWidth: 500,
            minHeight: 56,
            marginBottom: 20,
          }}
        >
          {currentQ.question}
        </div>

        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          {currentQ.options.map((opt, i) => {
            const letters = ["A", "B", "C", "D", "E"];
            return (
              <button
                key={opt.value}
                onClick={() => handleAnswer(opt.value, opt.burnRate)}
                disabled={processingQ}
                aria-label={`Select option ${letters[i]}: ${opt.label}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "11px 14px",
                  border: "1px solid #1e1e1e",
                  borderRadius: 2,
                  background: "transparent",
                  width: "100%",
                  textAlign: "left",
                  minHeight: 44,
                  gap: 12,
                  transition: "all 0.15s",
                  opacity: processingQ ? 0.4 : 1,
                }}
                onMouseEnter={(e) => {
                  if (processingQ) return;
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.borderColor = "#ff444033";
                  el.style.borderLeftColor = "#ff4444";
                  el.style.borderLeftWidth = "2px";
                  el.style.borderRadius = "0 2px 2px 0";
                  el.style.background = "#ff44440a";
                  const optSpan = el.querySelector(".opt-text") as HTMLElement;
                  if (optSpan) optSpan.style.color = "#ffffff";
                  const letterSpan = el.querySelector(".opt-letter") as HTMLElement;
                  if (letterSpan) letterSpan.style.color = "#ff444066";
                  const arrowSpan = el.querySelector(".opt-arrow") as HTMLElement;
                  if (arrowSpan) arrowSpan.style.color = "#ff444033";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.borderColor = "#1e1e1e";
                  el.style.borderLeftWidth = "1px";
                  el.style.borderRadius = "2px";
                  el.style.background = "transparent";
                  const optSpan = el.querySelector(".opt-text") as HTMLElement;
                  if (optSpan) optSpan.style.color = "#ffffff";
                  const letterSpan = el.querySelector(".opt-letter") as HTMLElement;
                  if (letterSpan) letterSpan.style.color = "#777777";
                  const arrowSpan = el.querySelector(".opt-arrow") as HTMLElement;
                  if (arrowSpan) arrowSpan.style.color = "#222222";
                }}
              >
                <span
                  className="opt-letter"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 16,
                    color: "#777777",
                    flexShrink: 0,
                    width: 16,
                    transition: "color 0.15s",
                  }}
                >
                  {letters[i]}.
                </span>
                <span
                  className="opt-text"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 9,
                    color: "#ffffff",
                    flex: 1,
                    lineHeight: 1.4,
                    transition: "color 0.15s",
                  }}
                >
                  {opt.label}
                </span>
                <span
                  className="opt-arrow"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 16,
                    color: "#222222",
                    flexShrink: 0,
                    transition: "color 0.15s",
                  }}
                >
                  ↵
                </span>
              </button>
            );
          })}
        </div>

        {/* Processing feedback */}
        {processingQ && (
          <div style={{ display: "flex", flexDirection: "column", gap: 3, minHeight: 0, marginTop: 8, marginBottom: 8 }}>
            {processingLines.map((l, i) => (
              <div
                key={i}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  color: "#555555",
                  letterSpacing: 1,
                }}
              >
                {l}
              </div>
            ))}
          </div>
        )}

        {/* Burn rate display — aria-live so screen readers announce updates after each answer */}
        {totalBurnRate > 0 && (
          <div
            aria-live="polite"
            aria-atomic="true"
            style={{
              marginTop: 8,
              fontFamily: "var(--font-mono)",
              fontSize: isMobile ? 20 : 28,
              fontWeight: 700,
              color: "#ff4444",
              fontVariantNumeric: "tabular-nums",
              textShadow: "0 0 10px rgba(255,68,68,0.3)",
            }}
          >
            -{totalBurnRate.toLocaleString()}s / DAY
          </div>
        )}

        {/* Category dots */}
        <div style={{ display: "flex", gap: 4, marginTop: 16 }}>
          {catKeys.map((_, i) => (
            <div
              key={i}
              style={{
                width: i < catIdx ? 18 : i === catIdx ? 10 : 6,
                height: 2,
                borderRadius: 1,
                background:
                  i < catIdx
                    ? "#ff4444"
                    : i === catIdx
                      ? "#ff444055"
                      : "#1e1e1e",
                transition: "background 0.3s, width 0.3s",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
