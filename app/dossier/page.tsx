/**
 * DOSSIER PAGE
 * The main intelligence hub displaying city carbon data across six tabs:
 * DOSSIER, EVIDENCE, TIMELINE, AUDIT, VERDICT, and ARCHIVE. Orchestrates
 * the full audit flow via useAuditFlow, renders a live countdown, and
 * provides a canvas-based share-card export of the user's verdict.
 */
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MemoryService } from "@/lib/memory-service";
import { CarbonData } from "@/lib/types";
import { useCountdown } from "@/hooks/useCountdown";
import { useAuditFlow } from "@/hooks/useAuditFlow";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";

import { DossierTab } from "./_components/DossierTab";
import { EvidenceTab } from "./_components/EvidenceTab";
import { TimelineTab } from "./_components/TimelineTab";
import { AuditTab } from "./_components/AuditTab";
import { VerdictTab } from "./_components/VerdictTab";
import { ArchiveTab } from "./_components/ArchiveTab";

// ── Types ──────────────────────────────────────────────
type Tab = "DOSSIER" | "EVIDENCE" | "TIMELINE" | "AUDIT" | "VERDICT" | "ARCHIVE";

// ── Helpers ────────────────────────────────────────────
function pad(n: number) {
  return String(n).padStart(2, "0");
}

// ── Main Component ─────────────────────────────────────
export default function DossierPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("DOSSIER");
  const [city] = useLocalStorageState<string>("dc_city", "");
  const [apiData] = useLocalStorageState<CarbonData | null>("dc_data", null);
  const [isMobile, setIsMobile] = useState(false);
  const [navError, setNavError] = useState<string | null>(null);

  // Tabs that require a scanned city with loaded data
  const LOCKED_TABS: Tab[] = ["TIMELINE", "AUDIT", "VERDICT", "ARCHIVE"];

  const handleTabChange = (newTab: Tab) => {
    if (LOCKED_TABS.includes(newTab) && !apiData) {
      setNavError("NO TARGET ACQUIRED — return to home and enter a city or country first.");
      setTimeout(() => setNavError(null), 3500);
      return;
    }
    setNavError(null);
    setTab(newTab);
    router.replace(`?tab=${newTab}`, { scroll: false });
  };

  const {
    catIdx,
    qIdx,
    answers,
    totalBurnRate,
    auditDone,
    loadingSwaps,
    missions,
    floatingRestore,
    showBurnoutPopup,
    setShowBurnoutPopup,
    profile,
    transitioning,
    transitionText,
    showBriefing,
    setShowBriefing,
    processingQ,
    processingLines,
    catKeys,
    currentCatKey,
    currentQuestions,
    currentQ,
    totalQs,
    answeredQs,
    handleAnswer,
    handleCommit,
    resetAudit,
    initFromStorage,
  } = useAuditFlow(city, () => setTab("VERDICT"));

  // Evidence bars animated
  const [barsVisible, setBarsVisible] = useState(false);

  useEffect(() => {
    if (!city) { router.replace("/"); return; }

    initFromStorage(city);

    // Check URL params for initial tab — respect lock if no data
    const searchParams = new URLSearchParams(window.location.search);
    const initialTab = searchParams.get("tab") as Tab | null;
    const allTabs: Tab[] = ["DOSSIER", "EVIDENCE", "TIMELINE", "AUDIT", "VERDICT", "ARCHIVE"];
    if (initialTab && allTabs.includes(initialTab)) {
      const lockedTabs: Tab[] = ["TIMELINE", "AUDIT", "VERDICT", "ARCHIVE"];
      if (lockedTabs.includes(initialTab) && !apiData) {
        setTab("DOSSIER");
        router.replace("?tab=DOSSIER", { scroll: false });
      } else {
        setTab(initialTab);
      }
    }
  }, [city, router, initFromStorage, apiData]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // When evidence tab opens, trigger bars
  useEffect(() => {
    if (tab === "EVIDENCE") {
      setBarsVisible(false);
      setTimeout(() => setBarsVisible(true), 50);
    }
  }, [tab]);

  // ── Countdown ──
  const secondsRemaining = apiData?.secondsRemaining ?? 0;
  const countdown = useCountdown(secondsRemaining);

  // ── Share card ──
  const generateShareCard = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext("2d")!;

    // BG: Deep Charcoal
    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, 1200, 800);

    const gradient = ctx.createRadialGradient(600, 400, 100, 600, 400, 800);
    gradient.addColorStop(0, "#1c1c1c");
    gradient.addColorStop(1, "#0a0a0a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 800);

    const margin = 40;
    const innerMargin = 50;
    const goldColor = "#cba052";

    ctx.strokeStyle = goldColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(margin, margin, 1200 - margin * 2, 800 - margin * 2);

    ctx.lineWidth = 1;
    ctx.strokeRect(innerMargin, innerMargin, 1200 - innerMargin * 2, 800 - innerMargin * 2);

    const drawCorner = (x: number, y: number, flipX: boolean, flipY: boolean) => {
      ctx.strokeStyle = goldColor;
      ctx.lineWidth = 2;
      const size = 20;
      ctx.beginPath();
      ctx.moveTo(x + (flipX ? size : -size), y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + (flipY ? size : -size));
      ctx.stroke();
    };
    drawCorner(innerMargin + 5, innerMargin + 5, true, true);
    drawCorner(1200 - innerMargin - 5, innerMargin + 5, false, true);
    drawCorner(innerMargin + 5, 800 - innerMargin - 5, true, false);
    drawCorner(1200 - innerMargin - 5, 800 - innerMargin - 5, false, false);

    ctx.fillStyle = goldColor;
    ctx.font = "400 16px 'IBM Plex Mono', monospace";
    ctx.textAlign = "center";
    ctx.letterSpacing = "4px";
    ctx.fillText("ISSUED BY THE CARBON INTELLIGENCE BUREAU", 600, 110);
    ctx.letterSpacing = "0px";

    const totalRestored = missions.filter(m => m.status === "completed").reduce((sum, m) => sum + m.secondsBack, 0);
    const isPositive = totalRestored > 0;

    ctx.fillStyle = "#ffffff";
    ctx.font = "400 42px 'Times New Roman', Times, serif";
    if (isPositive) {
      ctx.fillText("CERTIFICATE OF COMMENDATION", 600, 180);
    } else {
      ctx.fillText("CITATION OF ACCELERATED DECAY", 600, 180);
    }

    ctx.beginPath();
    ctx.moveTo(400, 220);
    ctx.lineTo(800, 220);
    ctx.strokeStyle = "rgba(203, 160, 82, 0.4)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#dddddd";
    ctx.font = "italic 400 22px 'Times New Roman', Times, serif";
    ctx.fillText("This is to formally declare that the target region of", 600, 270);

    ctx.fillStyle = goldColor;
    ctx.font = "600 52px 'IBM Plex Sans', sans-serif";
    ctx.fillText(city.toUpperCase(), 600, 340);

    ctx.fillStyle = "#dddddd";
    ctx.font = "italic 400 22px 'Times New Roman', Times, serif";
    if (isPositive) {
      ctx.fillText("has successfully reclaimed carbon budget and delayed the point of no return.", 600, 400);
    } else {
      ctx.fillText("has actively worsened their carbon deficit and accelerated the point of no return.", 600, 400);
    }

    if (isPositive) {
      const daily = totalRestored;
      const annual = totalRestored * 365.25;
      const daysReturned = (annual / 86400).toFixed(2);

      ctx.fillStyle = "#bbbbbb";
      ctx.font = "400 16px 'IBM Plex Mono', monospace";
      ctx.fillText("TIMELINE RECOVERY", 600, 450);
      ctx.fillStyle = "#00cc66";
      ctx.font = "600 32px 'IBM Plex Sans', sans-serif";
      ctx.fillText(`+${daily.toLocaleString()} sec/day`, 600, 485);

      ctx.fillStyle = "#bbbbbb";
      ctx.font = "400 16px 'IBM Plex Mono', monospace";
      ctx.fillText("ANNUAL RECOVERY", 600, 530);
      ctx.fillStyle = "#00cc66";
      ctx.font = "600 32px 'IBM Plex Sans', sans-serif";
      ctx.fillText(`+${annual.toLocaleString()} sec/year`, 600, 565);

      ctx.fillStyle = "#bbbbbb";
      ctx.font = "400 16px 'IBM Plex Mono', monospace";
      ctx.fillText("CLIMATE EQUIVALENT", 600, 610);
      ctx.fillStyle = "#00cc66";
      ctx.font = "600 24px 'IBM Plex Sans', sans-serif";
      ctx.fillText(`${daysReturned} days returned to the projected timeline`, 600, 640);
    } else {
      ctx.fillStyle = "#ff4444";
      ctx.font = "600 68px 'IBM Plex Sans', sans-serif";
      ctx.fillText(`-${totalBurnRate.toLocaleString()} SECONDS / DAY`, 600, 500);
      const impactClass = totalBurnRate > 5000 ? "ALPHA-1 CRITICAL" : totalBurnRate > 2000 ? "BETA-2 SEVERE" : "GAMMA-3 ELEVATED";
      ctx.fillStyle = "#777777";
      ctx.font = "400 18px 'IBM Plex Mono', monospace";
      ctx.fillText(`THREAT CLASS ASSIGNED: ${impactClass}`, 600, 560);
    }

    const sealX = 250;
    const sealY = 680;
    ctx.beginPath();
    ctx.arc(sealX, sealY, 45, 0, Math.PI * 2);
    ctx.strokeStyle = goldColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(sealX, sealY, 38, 0, Math.PI * 2);
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = goldColor;
    ctx.font = "600 28px 'IBM Plex Sans', sans-serif";
    ctx.fillText("CIB", sealX, sealY + 10);

    ctx.fillStyle = "#999999";
    ctx.font = "400 12px 'IBM Plex Mono', monospace";
    ctx.textAlign = "left";
    ctx.fillText("SEAL OF THE CARBON INTELLIGENCE BUREAU", sealX + 60, sealY + 5);

    ctx.textAlign = "right";
    ctx.fillStyle = goldColor;
    ctx.font = "italic 400 24px 'Times New Roman', Times, serif";
    ctx.fillText("C.I.B. Director", 1000, 670);

    ctx.beginPath();
    ctx.moveTo(800, 680);
    ctx.lineTo(1000, 680);
    ctx.strokeStyle = "#555555";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#999999";
    ctx.font = "400 14px 'IBM Plex Mono', monospace";
    ctx.fillText("deathclock.app", 1000, 710);

    const link = document.createElement("a");
    link.download = `deathclock-${city.toLowerCase()}-certificate.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // ── NAV ITEMS ──
  const cityAbbr = city ? city.slice(0, 3).toUpperCase() : "---";

  const NAV_ITEMS: { id: Tab; icon: string; label: string; badge?: string }[] = [
    { id: "DOSSIER", icon: "◈", label: "DOSSIER" },
    { id: "EVIDENCE", icon: "▣", label: "EVIDENCE" },
    { id: "TIMELINE", icon: "◷", label: "TIMELINE", badge: "LIVE" },
    { id: "AUDIT", icon: "⊙", label: "AUDIT" },
    { id: "VERDICT", icon: "⊕", label: "VERDICT" },
    { id: "ARCHIVE", icon: "◫", label: "ARCHIVE" },
  ];

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <h1 className="sr-only">City Dossier: {city}</h1>
      {/* ── HEADER ── */}
      <div
        style={{
          height: 44,
          borderBottom: "1px solid #141414",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 16,
            color: "#bbbbbb",
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          CIB DATABASE ›{" "}
          <span style={{ color: "#bbbbbb" }}>CITY RECORDS ›</span>{" "}
          <span style={{ color: "#ffffff" }}>{city.toUpperCase()}</span>
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            color: "#ff444433",
            letterSpacing: 2,
          }}
        >
          REF: CIB-2026-{cityAbbr}-001
        </div>
      </div>

      {/* ── BODY ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          overflow: "hidden",
        }}
      >
        {/* ── SIDEBAR (desktop) / TOP TAB BAR (mobile) ── */}
        {isMobile ? (
          <div
            role="tablist"
            aria-label="Dossier sections"
            style={{
              display: "flex",
              overflowX: "auto",
              borderBottom: "1px solid #0f0f0f",
              background: "#000",
              flexShrink: 0,
              padding: "0 4px",
            }}
          >
            {NAV_ITEMS.map((item) => {
              const isActive = tab === item.id;
              const isLocked = LOCKED_TABS.includes(item.id) && !apiData;
              return (
                <button
                  key={item.id}
                  id={`tab-${item.id}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`tabpanel-${item.id}`}
                  onClick={() => handleTabChange(item.id)}
                  aria-label={isLocked ? `${item.label} tab — enter a city first` : `Switch to ${item.label} tab`}
                  title={isLocked ? "Enter a city first" : undefined}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 16,
                    letterSpacing: 2,
                    padding: "10px 12px",
                    border: "none",
                    borderBottom: `2px solid ${isActive ? "#ff4444" : "transparent"}`,
                    background: "transparent",
                    color: isActive ? "#ffffff" : isLocked ? "#333333" : "#a0a0a0",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    textTransform: "uppercase",
                    cursor: isLocked ? "not-allowed" : "pointer",
                    opacity: isLocked ? 0.4 : 1,
                  }}
                >
                  {item.icon} {item.label}
                  {item.badge && (
                    <span style={{ color: "#ff4444", marginLeft: 4, fontSize: 9 }}>
                      {item.badge}
                    </span>
                  )}
                  {isLocked && <span style={{ marginLeft: 4, fontSize: 9, color: "#555" }}>⊘</span>}
                </button>
              );
            })}
          </div>
        ) : (
          <div
            role="tablist"
            aria-label="Dossier sections"
            style={{
              width: 180,
              background: "#000",
              borderRight: "1px solid #0f0f0f",
              flexShrink: 0,
              paddingTop: 8,
            }}
          >
            {NAV_ITEMS.map((item) => {
              const isActive = tab === item.id;
              const isLocked = LOCKED_TABS.includes(item.id) && !apiData;
              return (
                <button
                  key={item.id}
                  id={`tab-${item.id}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`tabpanel-${item.id}`}
                  onClick={() => handleTabChange(item.id)}
                  className={`nav-item${isActive ? " active" : ""}${isLocked ? " locked" : ""}`}
                  aria-label={isLocked ? `${item.label} tab — enter a city first` : `Switch to ${item.label} tab`}
                  title={isLocked ? "Enter a city first" : undefined}
                  style={isLocked ? { opacity: 0.35, cursor: "not-allowed", pointerEvents: "auto" } : undefined}
                >
                  <span style={{ flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {isLocked && <span style={{ fontSize: 9, color: "#555", marginLeft: 2 }}>⊘</span>}
                  {item.badge && !isLocked && (
                    <span className="nav-badge">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ── CONTENT AREA ── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              id={`tabpanel-${tab}`}
              role="tabpanel"
              aria-labelledby={`tab-${tab}`}
              tabIndex={0}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
            >
              {tab === "DOSSIER" && (
                <DossierTab
                  city={city}
                  apiData={apiData}
                  isMobile={isMobile}
                  onNext={() => handleTabChange("EVIDENCE")}
                />
              )}
              {tab === "EVIDENCE" && (
                <EvidenceTab
                  isMobile={isMobile}
                  barsVisible={barsVisible}
                  onNext={() => handleTabChange("TIMELINE")}
                />
              )}
              {tab === "TIMELINE" && (
                <TimelineTab
                  city={city}
                  isMobile={isMobile}
                  countdown={countdown}
                  auditDone={auditDone}
                  totalBurnRate={totalBurnRate}
                  onGoToAudit={() => handleTabChange("AUDIT")}
                />
              )}
              {tab === "AUDIT" && (
                <AuditTab
                  isMobile={isMobile}
                  showBriefing={showBriefing}
                  setShowBriefing={setShowBriefing}
                  loadingSwaps={loadingSwaps}
                  auditDone={auditDone}
                  currentQ={currentQ}
                  catIdx={catIdx}
                  qIdx={qIdx}
                  catKeys={catKeys}
                  totalBurnRate={totalBurnRate}
                  totalQs={totalQs}
                  transitioning={transitioning}
                  transitionText={transitionText}
                  processingQ={processingQ}
                  processingLines={processingLines}
                  handleAnswer={handleAnswer}
                  resetAudit={resetAudit}
                  onGoToVerdict={() => handleTabChange("VERDICT")}
                />
              )}
              {tab === "VERDICT" && (
                <VerdictTab
                  city={city}
                  isMobile={isMobile}
                  totalBurnRate={totalBurnRate}
                  missions={missions}
                  loadingSwaps={loadingSwaps}
                  floatingRestore={floatingRestore}
                  answers={answers}
                  catKeys={catKeys}
                  profile={profile}
                  handleCommit={handleCommit}
                  generateShareCard={generateShareCard}
                  onGoToArchive={() => handleTabChange("ARCHIVE")}
                />
              )}
              {tab === "ARCHIVE" && (
                <ArchiveTab
                  isMobile={isMobile}
                  profile={profile}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      {/* ── NAV ERROR TOAST ── */}
      {navError && (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            position: "fixed",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#0c0c0c",
            border: "1px solid #ff4444",
            borderLeft: "4px solid #ff4444",
            padding: "14px 24px",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "#ff4444",
            letterSpacing: 2,
            textTransform: "uppercase",
            zIndex: 10001,
            maxWidth: 480,
            textAlign: "center",
            boxShadow: "0 0 30px rgba(255,68,68,0.2)",
            animation: "fadeInUp 0.2s ease",
          }}
        >
          ⊘ {navError}
        </div>
      )}
      {showBurnoutPopup && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#0c0c0c", border: "1px solid #ff4444", padding: 40, maxWidth: 500, textAlign: "center", fontFamily: "var(--font-mono)" }}>
            <div style={{ color: "#ff4444", fontSize: 22, marginBottom: 16, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 2 }}>CRITICAL BURNOUT DETECTED</div>
            <div style={{ color: "#ffffff", fontSize: 16, marginBottom: 24, lineHeight: 1.6, textTransform: "uppercase" }}>
              YOUR PERSONAL BURNOUT IS <span style={{ color: "#ffaa00" }}>{totalBurnRate.toLocaleString()} SECONDS PER DAY</span>, CAUSING {city.toUpperCase()} TO DEGRADE ITS LIFE FASTER.
            </div>
            <button className="btn-primary" onClick={() => setShowBurnoutPopup(false)} aria-label="Acknowledge critical burnout">ACKNOWLEDGE</button>
          </div>
        </div>
      )}
    </div>
  );
}
