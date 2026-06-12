"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { QUESTION_BANK, CATEGORY_NAMES, CATEGORY_KEYS } from "@/lib/questions";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ──────────────────────────────────────────────
type Tab = "DOSSIER" | "EVIDENCE" | "TIMELINE" | "AUDIT" | "VERDICT";

interface ApiData {
  remainingBudgetTonnes: number;
  annualEmissionRate: number;
  secondsRemaining: number;
  contextSentence: string;
}

interface Swap {
  action: string;
  secondsBack: number;
  difficulty: "easy" | "medium" | "hard";
  localContext: string;
}

// ── Constants ──────────────────────────────────────────
const BREACH_DATE = new Date("2033-06-11T00:00:00Z");

const EVIDENCE_BARS = [
  { label: "TRANSPORT", pct: 78, color: "#ff4444" },
  { label: "ENERGY", pct: 85, color: "#ff4444" },
  { label: "INDUSTRY", pct: 62, color: "#ffaa00" },
  { label: "WASTE", pct: 45, color: "#ffaa00" },
  { label: "AGRICULTURE", pct: 28, color: "#00cc6644" },
  { label: "BUILDINGS", pct: 55, color: "#ffaa00" },
];

const DIFF_COLORS: Record<string, string> = {
  easy: "#00cc66",
  medium: "#ffaa00",
  hard: "#ff4444",
};

// ── Helpers ────────────────────────────────────────────
function pad(n: number) {
  return String(n).padStart(2, "0");
}

function useCountdown(secondsRemaining: number) {
  const [ticks, setTicks] = useState(secondsRemaining);

  useEffect(() => {
    setTicks(secondsRemaining);
  }, [secondsRemaining]);

  useEffect(() => {
    if (ticks <= 0) return;
    const t = setInterval(() => setTicks((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [ticks > 0]);

  const yrs = Math.floor(ticks / (365.25 * 24 * 3600));
  const rem = ticks - yrs * Math.floor(365.25 * 24 * 3600);
  const days = Math.floor(rem / (24 * 3600));
  const rem2 = rem - days * 24 * 3600;
  return { yrs, days, hh: pad(Math.floor(rem2 / 3600)), mm: pad(Math.floor((rem2 % 3600) / 60)), ss: pad(rem2 % 60) };
}

function formatBurnRate(sPerDay: number): string {
  return `${sPerDay.toLocaleString()}s / DAY`;
}

// ── Main Component ─────────────────────────────────────
export default function DossierPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("DOSSIER");
  const [city, setCity] = useState("");
  const [apiData, setApiData] = useState<ApiData | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Audit state
  const [catIdx, setCatIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [totalBurnRate, setTotalBurnRate] = useState(0);
  const [auditDone, setAuditDone] = useState(false);
  const [loadingSwaps, setLoadingSwaps] = useState(false);
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [committed, setCommitted] = useState<string[]>([]);
  const [floatingRestore, setFloatingRestore] = useState<{ id: string; seconds: number; key: number } | null>(null);
  const [showBurnoutPopup, setShowBurnoutPopup] = useState(false);

  // Audit transition
  const [transitioning, setTransitioning] = useState(false);
  const [transitionText, setTransitionText] = useState("");

  // Processing state
  const [processingQ, setProcessingQ] = useState(false);
  const [processingLines, setProcessingLines] = useState<string[]>([]);

  // Evidence bars animated
  const [barsVisible, setBarsVisible] = useState(false);

  useEffect(() => {
    const c = localStorage.getItem("dc_city") || "";
    if (!c) { router.replace("/"); return; }
    setCity(c);

    const raw = localStorage.getItem("dc_data");
    if (raw) {
      try { setApiData(JSON.parse(raw)); } catch { }
    }

    const rawSwaps = localStorage.getItem("dc_swaps");
    if (rawSwaps) { try { setSwaps(JSON.parse(rawSwaps)); } catch { } }

    const rawCommitted = localStorage.getItem("dc_committed");
    if (rawCommitted) { try { setCommitted(JSON.parse(rawCommitted)); } catch { } }
  }, [router]);

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

  // ── Audit logic ──
  const catKeys = CATEGORY_KEYS;
  const currentCatKey = catKeys[catIdx];
  const currentQuestions = currentCatKey ? QUESTION_BANK[currentCatKey] : [];
  const currentQ = currentQuestions[qIdx];
  const totalQs = catKeys.reduce((sum, k) => sum + QUESTION_BANK[k].length, 0);
  const answeredQs = Object.keys(answers).length;

  const handleAnswer = (optionValue: string, burnRate: number) => {
    if (processingQ || transitioning) return;

    const newAnswers = { ...answers, [currentQ.id]: optionValue };
    const newBurn = totalBurnRate + burnRate;
    setAnswers(newAnswers);
    setTotalBurnRate(newBurn);

    // Show processing lines
    setProcessingQ(true);
    setProcessingLines([]);
    const lines = ["> PROCESSING INPUT...", "> CALCULATING DELTA...", "> UPDATING TIMELINE..."];
    lines.forEach((l, i) => {
      setTimeout(() => {
        setProcessingLines((prev) => [...prev, l]);
      }, i * 50);
    });

    setTimeout(() => {
      setProcessingQ(false);
      setProcessingLines([]);

      const nextQIdx = qIdx + 1;
      if (nextQIdx < currentQuestions.length) {
        setQIdx(nextQIdx);
      } else {
        const nextCatIdx = catIdx + 1;
        if (nextCatIdx < catKeys.length) {
          // Show transition screen
          const nextCatName = CATEGORY_NAMES[nextCatIdx];
          setTransitionText(`ADVANCING TO ${nextCatName} ›`);
          setTransitioning(true);
          setTimeout(() => {
            setTransitioning(false);
            setCatIdx(nextCatIdx);
            setQIdx(0);
          }, 500);
        } else {
          // All done — call swaps API
          setCatIdx(nextCatIdx); // Set beyond array to trigger "AUDIT COMPLETE"
          finishAudit(newAnswers, newBurn);
        }
      }
    }, 200);
  };

  const finishAudit = async (allAnswers: Record<string, string>, burnRate: number) => {
    setLoadingSwaps(true);
    setTab("VERDICT");
    try {
      const res = await fetch("/api/swaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cityName: city,
          allAnswers,
          personalDailySeconds: burnRate,
        }),
      });
      const data = await res.json();
      const swapList: Swap[] = data.swaps || [];
      if (swapList.length === 0) throw new Error("Empty swaps from API");
      setSwaps(swapList);
      localStorage.setItem("dc_swaps", JSON.stringify(swapList));
    } catch {
      const fallback: Swap[] = [
        { action: "Switch to renewable energy provider", secondsBack: 15000, difficulty: "medium", localContext: `Look for local green energy options in ${city}.` },
        { action: "Reduce red meat to once a week", secondsBack: 8000, difficulty: "easy", localContext: `Explore plant-based food in ${city}.` },
        { action: "Replace 3 car trips with transit", secondsBack: 5000, difficulty: "medium", localContext: `Use the public transit network in ${city}.` },
      ];
      setSwaps(fallback);
      localStorage.setItem("dc_swaps", JSON.stringify(fallback));
    } finally {
      setLoadingSwaps(false);
      setAuditDone(true);
      setShowBurnoutPopup(true);
    }
  };

  const handleCommit = (swap: Swap, idx: number) => {
    const id = `swap_${idx}`;
    const alreadyCommitted = committed.includes(id) || committed.includes(idx as any);

    let newCommitted: string[];
    if (alreadyCommitted) {
      newCommitted = committed.filter((c) => c !== id && c !== (idx as any));
    } else {
      newCommitted = [...committed, id];
    }

    setCommitted(newCommitted);
    localStorage.setItem("dc_committed", JSON.stringify(newCommitted));

    // Float animation
    if (!alreadyCommitted) {
      setFloatingRestore({ id, seconds: swap.secondsBack, key: Date.now() });
      setTimeout(() => setFloatingRestore(null), 1500);
    }
  };

  // ── Share card ──
  const generateShareCard = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 800; // Increased height for a taller certificate look
    const ctx = canvas.getContext("2d")!;

    // BG: Deep Charcoal
    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, 1200, 800);

    // Subtle grain or gradient effect (simulated by a very subtle center radial gradient)
    const gradient = ctx.createRadialGradient(600, 400, 100, 600, 400, 800);
    gradient.addColorStop(0, "#1c1c1c");
    gradient.addColorStop(1, "#0a0a0a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 800);

    // Border Constants
    const margin = 40;
    const innerMargin = 50;
    const goldColor = "#cba052";

    // Outer Border (Thick)
    ctx.strokeStyle = goldColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(margin, margin, 1200 - margin * 2, 800 - margin * 2);

    // Inner Border (Thin)
    ctx.lineWidth = 1;
    ctx.strokeRect(innerMargin, innerMargin, 1200 - innerMargin * 2, 800 - innerMargin * 2);

    // Corner Accents
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

    // Sub-header (CIB)
    ctx.fillStyle = goldColor;
    ctx.font = "400 16px 'IBM Plex Mono', monospace";
    ctx.textAlign = "center";
    ctx.letterSpacing = "4px";
    ctx.fillText("ISSUED BY THE CARBON INTELLIGENCE BUREAU", 600, 110);
    ctx.letterSpacing = "0px"; // Reset letter spacing

    // Check data
    const totalRestored = committed.reduce((sum, id) => {
      const idx = parseInt(String(id).replace("swap_", ""));
      return sum + (swaps[idx]?.secondsBack || 0);
    }, 0);

    const isPositive = totalRestored > 0;

    // Header (Title)
    ctx.fillStyle = "#ffffff";
    ctx.font = "400 42px 'Times New Roman', Times, serif"; // Formal Serif
    if (isPositive) {
      ctx.fillText("CERTIFICATE OF COMMENDATION", 600, 180);
    } else {
      ctx.fillText("CITATION OF ACCELERATED DECAY", 600, 180);
    }

    // Divider Line
    ctx.beginPath();
    ctx.moveTo(400, 220);
    ctx.lineTo(800, 220);
    ctx.strokeStyle = "rgba(203, 160, 82, 0.4)"; // Faded gold
    ctx.lineWidth = 1;
    ctx.stroke();

    // Body Text
    ctx.fillStyle = "#aaaaaa";
    ctx.font = "italic 400 22px 'Times New Roman', Times, serif";
    ctx.fillText("This is to formally declare that the target region of", 600, 270);

    // City
    ctx.fillStyle = goldColor;
    ctx.font = "600 52px 'IBM Plex Sans', sans-serif";
    ctx.fillText(city.toUpperCase(), 600, 340);

    // Sub-text
    ctx.fillStyle = "#aaaaaa";
    ctx.font = "italic 400 22px 'Times New Roman', Times, serif";
    if (isPositive) {
      ctx.fillText("has successfully reclaimed carbon budget and delayed the point of no return.", 600, 400);
    } else {
      ctx.fillText("has actively worsened their carbon deficit and accelerated the point of no return.", 600, 400);
    }

    // The Big Number
    ctx.fillStyle = isPositive ? "#00cc66" : "#ff4444";
    ctx.font = "600 68px 'IBM Plex Sans', sans-serif";
    const amountText = isPositive ? `+${totalRestored.toLocaleString()} SECONDS / DAY` : `-${totalBurnRate.toLocaleString()} SECONDS / DAY`;
    ctx.fillText(amountText, 600, 500);

    // Mission / Threat Class
    ctx.fillStyle = "#777777";
    ctx.font = "400 18px 'IBM Plex Mono', monospace";
    if (isPositive && committed.length > 0) {
      const firstCommitIdx = parseInt(String(committed[0]).replace("swap_", ""));
      const mission = swaps[firstCommitIdx];
      if (mission) {
        ctx.fillText(`PRIMARY INTERVENTION: ${mission.action.toUpperCase()}`, 600, 560);
      }
    } else if (!isPositive) {
      const impactClass = totalBurnRate > 5000 ? "ALPHA-1 CRITICAL" : totalBurnRate > 2000 ? "BETA-2 SEVERE" : "GAMMA-3 ELEVATED";
      ctx.fillText(`THREAT CLASS ASSIGNED: ${impactClass}`, 600, 560);
    }

    // Bottom Seal
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

    // Bottom Text Left
    ctx.fillStyle = "#666666";
    ctx.font = "400 12px 'IBM Plex Mono', monospace";
    ctx.textAlign = "left";
    ctx.fillText("SEAL OF THE CARBON INTELLIGENCE BUREAU", sealX + 60, sealY + 5);

    // Bottom Right (Signature / URL)
    ctx.textAlign = "right";
    ctx.fillStyle = goldColor;
    ctx.font = "italic 400 24px 'Times New Roman', Times, serif";
    ctx.fillText("C.I.B. Director", 1000, 670);

    // Signature Line
    ctx.beginPath();
    ctx.moveTo(800, 680);
    ctx.lineTo(1000, 680);
    ctx.strokeStyle = "#555555";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#666666";
    ctx.font = "400 14px 'IBM Plex Mono', monospace";
    ctx.fillText("deathclock.app", 1000, 710);

    // Download
    const link = document.createElement("a");
    link.download = `deathclock-${city.toLowerCase()}-certificate.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // ── Render helpers ──
  const formatBudget = (n: number) => {
    if (!n) return "—";
    if (n > 1e12) return `${(n / 1e12).toFixed(1)}T TONNES CO₂`;
    if (n > 1e9) return `${(n / 1e9).toFixed(1)}B TONNES CO₂`;
    if (n > 1e6) return `${(n / 1e6).toFixed(1)}M TONNES CO₂`;
    return `${n.toLocaleString()} TONNES CO₂`;
  };

  const formatEmissions = (n: number) => {
    if (!n) return "—";
    if (n > 1e9) return `${(n / 1e9).toFixed(2)}B T/YR`;
    if (n > 1e6) return `${(n / 1e6).toFixed(1)}M T/YR`;
    return `${n.toLocaleString()} T/YR`;
  };

  const cityAbbr = city ? city.slice(0, 3).toUpperCase() : "---";

  // ── TAB CONTENT RENDERERS ──

  const renderDossier = () => (
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
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#888880", letterSpacing: 3, textTransform: "uppercase", marginTop: 8 }}>
            TARGET REGION · 19.0°N 72.8°E
          </div>
        </div>
        <div
          style={{
            transform: "rotate(-4deg)",
            border: "2px solid #ff4444",
            color: "#ff4444",
            fontFamily: "var(--font-mono)",
            fontSize: 10,
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
          <div style={{ position: "absolute", bottom: 8, left: 8, fontFamily: "var(--font-mono)", fontSize: 8, color: "#555", letterSpacing: 2 }}>
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
              <div
                key={i}
                style={{
                  background: "#080808",
                  padding: "20px 24px",
                }}
              >
                <div className="doc-label" style={{ marginBottom: 8, color: "#666" }}>{cell.label}</div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 16,
                    color: cell.color,
                    fontVariantNumeric: "tabular-nums",
                    fontWeight: 500,
                    textShadow: `0 0 10px ${cell.color}40`,
                  }}
                >
                  {cell.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="intel-box" style={{ background: "#080808", border: "1px solid #1a1a1a", borderLeft: "2px solid #00cc66" }}>
        <div className="intel-label" style={{ color: "#00cc66" }}>FIELD INTELLIGENCE</div>
        <div className="intel-text" style={{ color: "#e0e0e0", fontSize: 13, lineHeight: 1.6 }}>
          {apiData?.contextSentence || "Carbon telemetry systems are online. Intelligence data is being processed for this target location."}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "auto", paddingTop: 10 }}>
        <button
          className="btn-ghost"
          onClick={() => setTab("EVIDENCE")}
          style={{ width: isMobile ? "100%" : "auto", padding: "12px 32px" }}
        >
          NEXT ›
        </button>
      </div>
    </div>
  );

  const renderEvidence = () => (
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
          <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 10, color: "#888880", lineHeight: 1.6 }}>
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
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#e0e0e0", letterSpacing: 2 }}>{bar.label}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: bar.color, letterSpacing: 1, textShadow: `0 0 8px ${bar.color}44` }}>{bar.pct}%</span>
                </div>
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
          <div className="intel-box" style={{ background: "rgba(255, 68, 68, 0.05)", borderLeft: "2px solid #ff4444" }}>
            <div className="intel-label" style={{ color: "#ff4444" }}>
              <span className="live-dot" style={{ width: 6, height: 6 }} /> CRITICAL FINDING
            </div>
            <div className="intel-text" style={{ color: "#f4f4f4", fontSize: 12 }}>
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
              fontSize: 8,
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

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "auto", paddingTop: 20 }}>
        <button
          className="btn-ghost"
          onClick={() => setTab("TIMELINE")}
          style={{ width: isMobile ? "100%" : "auto", padding: "12px 32px" }}
        >
          NEXT ›
        </button>
      </div>
    </div>
  );

  const renderTimeline = () => (
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
                    fontSize: 8,
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
                    fontSize: 24,
                    color: "#333333",
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
                fontSize: 10,
                color: "#ff4444",
                fontWeight: 700,
                letterSpacing: 1,
              }}
            >
              77.3% DEPLETED
            </span>
          </div>
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
            onClick={() => setTab("AUDIT")}
            style={{
              width: "100%",
              padding: "20px 0",
              fontSize: 14,
              letterSpacing: 4,
              boxShadow: "0 0 20px rgba(255, 68, 68, 0.2)"
            }}
          >
            ENTER AUDIT MODE ›
          </button>
        </div>
      </div>
    </div>
  );

  const renderAudit = () => {
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
          <button className="btn-ghost" onClick={() => setTab("VERDICT")}>
            VIEW VERDICT ›
          </button>
        </div>
      );
    }

    if (!currentQ) return null;

    const catKey = catKeys[catIdx];
    const catName = CATEGORY_NAMES[catIdx];
    const qNumber = catKeys.slice(0, catIdx).reduce((s, k) => s + QUESTION_BANK[k].length, 0) + qIdx + 1;

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
                  fontSize: 22,
                  color: "#ffffff",
                  fontWeight: 500,
                }}
              >
                ✓ SECTION COMPLETE
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
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
                fontSize: 8,
                color: "#666666",
                letterSpacing: 3,
                textTransform: "uppercase",
              }}
            >
              PERSONAL AUDIT // {catName}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button
                onClick={() => {
                  setCatIdx(0);
                  setQIdx(0);
                  setTotalBurnRate(0);
                  setAnswers({});
                  setAuditDone(false);
                  setSwaps([]);
                  localStorage.removeItem("dc_burnrate");
                  localStorage.removeItem("dc_answers");
                  localStorage.removeItem("dc_swaps");
                  localStorage.setItem("dc_catIdx", "0");
                  localStorage.setItem("dc_qIdx", "0");
                }}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 8,
                  color: "#ff4444",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  letterSpacing: 2,
                  textDecoration: "underline",
                }}
              >
                [ RESTART AUDIT ]
              </button>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 8,
                  color: "#555555",
                  letterSpacing: 2,
                }}
              >
                Q {qNumber}/{totalQs}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="progress-track" style={{ marginBottom: 16 }}>
            <div
              className="progress-fill"
              style={{ width: `${(qNumber / totalQs) * 100}%` }}
            />
          </div>

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
                fontSize: 8,
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
                    if (letterSpan) letterSpan.style.color = "#444444";
                    const arrowSpan = el.querySelector(".opt-arrow") as HTMLElement;
                    if (arrowSpan) arrowSpan.style.color = "#222222";
                  }}
                >
                  <span
                    className="opt-letter"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 8,
                      color: "#444444",
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
                      fontSize: 11,
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
                      fontSize: 10,
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
                    color: "#333333",
                    letterSpacing: 1,
                  }}
                >
                  {l}
                </div>
              ))}
            </div>
          )}

          {/* Burn rate display */}
          {totalBurnRate > 0 && (
            <div
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
  };

  const renderVerdict = () => (
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

      <div className="doc-label" style={{ marginBottom: 12, color: "#666666" }}>
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
          { label: "IMPACT CLASS", value: totalBurnRate > 5000 ? "ALPHA" : totalBurnRate > 2000 ? "BETA" : "GAMMA" },
        ].map((cell, i) => (
          <div key={i} style={{ background: "#0d0d0d", padding: 12, border: "1px solid #1e1e1e" }}>
            <div className="doc-label" style={{ marginBottom: 6 }}>{cell.label}</div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 14,
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

      {/* Category breakdown bars */}
      <div style={{ marginBottom: 20 }}>
        <div className="doc-label" style={{ marginBottom: 12, color: "#aaaaaa" }}>CATEGORY BREAKDOWN</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {CATEGORY_NAMES.map((name, i) => {
            const catKey = catKeys[i];
            const catAnswers = QUESTION_BANK[catKey].map((q) => {
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
                    fontSize: 8,
                    color: "#aaaaaa",
                    width: 100,
                    flexShrink: 0,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                  }}
                >
                  {name}
                </span>
                <div className="cat-bar-track">
                  <div
                    className="cat-bar-fill"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 8,
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
      <div className="doc-label" style={{ marginBottom: 12, color: "#aaaaaa" }}>RECOMMENDED MISSIONS</div>

      {loadingSwaps ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="spinner" style={{ width: 14, height: 14, border: "2px solid #ff4444", borderTopColor: "transparent", borderRadius: "50%" }} />
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
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
              color: "#cccccc",
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
      ) : swaps.length === 0 ? (
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
          {swaps.map((swap, idx) => {
            const id = `swap_${idx}`;
            const isCommitted = committed.includes(id);
            return (
              <div
                key={idx}
                onClick={() => handleCommit(swap, idx)}
                style={{
                  border: `1px solid ${isCommitted ? "#ff444055" : "#1e1e1e"}`,
                  borderRadius: 2,
                  padding: 14,
                  background: isCommitted ? "#ff44440d" : "#0d0d0d",
                  display: "flex",
                  gap: 16,
                  transition: "all 0.2s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.borderColor = "#ff444033";
                  el.style.background = "#ff44440a";
                  const actionEl = el.querySelector(".mission-action") as HTMLElement;
                  if (actionEl) actionEl.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.borderColor = isCommitted ? "#ff444055" : "#1e1e1e";
                  el.style.background = isCommitted ? "#ff44440d" : "#0d0d0d";
                  const actionEl = el.querySelector(".mission-action") as HTMLElement;
                  if (actionEl) actionEl.style.color = isCommitted ? "#ffffff" : "#888880";
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 7,
                      color: "#888888",
                      letterSpacing: 2,
                      textTransform: "uppercase",
                      marginBottom: 4,
                    }}
                  >
                    MSN-{String(idx + 1).padStart(3, "0")}
                  </div>
                  <div
                    className="mission-action"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: isCommitted ? "#ffffff" : "#eeeeee",
                      lineHeight: 1.5,
                      marginBottom: 4,
                      transition: "color 0.15s",
                    }}
                  >
                    {swap.action.toUpperCase()}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      color: "#cccccc",
                      lineHeight: 1.6,
                    }}
                  >
                    {swap.localContext}
                  </div>
                </div>
                <div style={{ flexShrink: 0, textAlign: "right" }}>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 13,
                      color: "#ff4444",
                      fontVariantNumeric: "tabular-nums",
                      marginBottom: 6,
                    }}
                  >
                    +{swap.secondsBack.toLocaleString()}s
                  </div>
                  {isCommitted ? (
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 9,
                        color: "#00cc66",
                        letterSpacing: 2,
                        textTransform: "uppercase",
                      }}
                    >
                      ✓ COMMITTED
                    </div>
                  ) : (
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 8,
                        color: DIFF_COLORS[swap.difficulty] + "77",
                        letterSpacing: 2,
                        background: "#ff444015",
                        padding: "2px 6px",
                        borderRadius: 1,
                        textTransform: "uppercase",
                      }}
                    >
                      {swap.difficulty}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Broadcast button */}
      <button
        className="btn-primary"
        style={{ width: "100%", marginTop: 8 }}
        onClick={generateShareCard}
      >
        BROADCAST VERDICT
      </button>
    </div>
  );

  // ── NAV ITEMS ──
  const NAV_ITEMS: { id: Tab; icon: string; label: string; badge?: string }[] = [
    { id: "DOSSIER", icon: "◈", label: "DOSSIER" },
    { id: "EVIDENCE", icon: "▣", label: "EVIDENCE" },
    { id: "TIMELINE", icon: "◷", label: "TIMELINE", badge: "LIVE" },
    { id: "AUDIT", icon: "⊙", label: "AUDIT" },
    { id: "VERDICT", icon: "⊕", label: "VERDICT" },
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
            fontSize: 8,
            color: "#888880",
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          CIB DATABASE ›{" "}
          <span style={{ color: "#888880" }}>CITY RECORDS ›</span>{" "}
          <span style={{ color: "#ffffff" }}>{city.toUpperCase()}</span>
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 7,
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
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 8,
                    letterSpacing: 2,
                    padding: "10px 12px",
                    border: "none",
                    borderBottom: `2px solid ${isActive ? "#ff4444" : "transparent"}`,
                    background: "transparent",
                    color: isActive ? "#ffffff" : "#a0a0a0",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    textTransform: "uppercase",
                  }}
                >
                  {item.icon} {item.label}
                  {item.badge && (
                    <span style={{ color: "#ff4444", marginLeft: 4, fontSize: 7 }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div
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
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`nav-item${isActive ? " active" : ""}`}
                >
                  <span style={{ flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge && (
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
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
            >
              {tab === "DOSSIER" && renderDossier()}
              {tab === "EVIDENCE" && renderEvidence()}
              {tab === "TIMELINE" && renderTimeline()}
              {tab === "AUDIT" && renderAudit()}
              {tab === "VERDICT" && renderVerdict()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      {showBurnoutPopup && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#0c0c0c", border: "1px solid #ff4444", padding: 40, maxWidth: 500, textAlign: "center", fontFamily: "var(--font-mono)" }}>
            <div style={{ color: "#ff4444", fontSize: 24, marginBottom: 16, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 2 }}>CRITICAL BURNOUT DETECTED</div>
            <div style={{ color: "#ffffff", fontSize: 14, marginBottom: 24, lineHeight: 1.6, textTransform: "uppercase" }}>
              YOUR PERSONAL BURNOUT IS <span style={{ color: "#ffaa00" }}>{totalBurnRate.toLocaleString()} SECONDS PER DAY</span>, CAUSING {city.toUpperCase()} TO DEGRADE ITS LIFE FASTER.
            </div>
            <button className="btn-primary" onClick={() => setShowBurnoutPopup(false)}>ACKNOWLEDGE</button>
          </div>
        </div>
      )}
    </div>
  );
}
