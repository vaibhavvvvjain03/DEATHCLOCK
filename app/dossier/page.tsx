"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { QUESTION_BANK, CATEGORY_NAMES, CATEGORY_KEYS } from "@/lib/questions";
import { motion, AnimatePresence } from "framer-motion";
import { MemoryService, ClimateProfile, AuditProgress, MissionRecord } from "@/lib/memory-service";
import { CarbonData } from "@/lib/types";
import { calculateBurnRate } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────
type Tab = "DOSSIER" | "EVIDENCE" | "TIMELINE" | "AUDIT" | "VERDICT" | "ARCHIVE";

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
  const [apiData, setApiData] = useState<CarbonData | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab);
    router.replace(`?tab=${newTab}`, { scroll: false });
  };

  const [catIdx, setCatIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const totalBurnRate = useMemo(() => calculateBurnRate(answers), [answers]);
  const [auditDone, setAuditDone] = useState(false);
  const [loadingSwaps, setLoadingSwaps] = useState(false);
  const [missions, setMissions] = useState<MissionRecord[]>([]);
  const [floatingRestore, setFloatingRestore] = useState<{ id: string; seconds: number; key: number } | null>(null);
  const [showBurnoutPopup, setShowBurnoutPopup] = useState(false);
  const [profile, setProfile] = useState<ClimateProfile | null>(null);

  // Audit transition
  const [transitioning, setTransitioning] = useState(false);
  const [transitionText, setTransitionText] = useState("");
  const [showBriefing, setShowBriefing] = useState(true);

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

    const existingProfile = MemoryService.getProfile();
    if (existingProfile) {
      setProfile(existingProfile);
      setMissions(existingProfile.missions || []);
    }

    const progress = MemoryService.getAuditProgress();
    if (progress && progress.city === c) {
      setCatIdx(progress.catIdx);
      setQIdx(progress.qIdx);
      setAnswers(progress.answers);
      if (progress.catIdx > 0 || progress.qIdx > 0) {
        setShowBriefing(false);
      }
    }
    
    // Check URL params for initial tab
    const searchParams = new URLSearchParams(window.location.search);
    const initialTab = searchParams.get("tab");
    if (initialTab && ["DOSSIER", "EVIDENCE", "TIMELINE", "AUDIT", "VERDICT", "ARCHIVE"].includes(initialTab)) {
      setTab(initialTab as Tab);
    }
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
    // We calculate new burn rate locally to pass to MemoryService/finishAudit directly
    const newBurn = calculateBurnRate(newAnswers);
    setAnswers(newAnswers);

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
        MemoryService.saveAuditProgress({ city, catIdx, qIdx: nextQIdx, answers: newAnswers, totalBurnRate: newBurn });
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
            MemoryService.saveAuditProgress({ city, catIdx: nextCatIdx, qIdx: 0, answers: newAnswers, totalBurnRate: newBurn });
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
    const categoryScores: Record<string, number> = {};
    CATEGORY_KEYS.forEach(key => {
      let score = 0;
      QUESTION_BANK[key].forEach(q => {
        const selectedVal = allAnswers[q.id];
        const option = q.options.find(o => o.value === selectedVal);
        if (option) score += option.burnRate;
      });
      categoryScores[key] = Math.max(0, score);
    });

    const createProfileObject = (newMissions: MissionRecord[]) => {
      const existingProfile = MemoryService.getProfile();
      const pastInvestigations = existingProfile?.pastInvestigations || [];
      
      if (existingProfile) {
        pastInvestigations.push({
          id: `INV-${String(existingProfile.totalInvestigations).padStart(3, '0')}`,
          city: existingProfile.city,
          burnRate: existingProfile.personalBurnRate,
          categoryScores: existingProfile.categoryScores || {},
          completionDate: existingProfile.auditCompletionDate || existingProfile.lastVisitDate,
          answers: existingProfile.answers
        });
      }

      return {
        city,
        answers: allAnswers,
        personalBurnRate: burnRate,
        categoryScores,
        missions: newMissions,
        verdict: "COMPLETED",
        auditCompletionDate: new Date().toISOString(),
        totalInvestigations: existingProfile ? existingProfile.totalInvestigations + 1 : 1,
        pastInvestigations
      };
    };

    try {
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 10000);

      const res = await fetch("/api/swaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cityName: city,
          allAnswers,
          personalDailySeconds: burnRate,
        }),
        signal: abortController.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      const swapList = data.swaps || [];
      if (swapList.length === 0) throw new Error("Empty swaps from API");
      
      const newMissions: MissionRecord[] = swapList.map((s: Partial<MissionRecord>, i: number) => ({
        id: `msn_${Date.now()}_${i}`,
        ...s,
        status: "pending"
      } as MissionRecord));
      setMissions(newMissions);
      
      MemoryService.saveProfile(createProfileObject(newMissions));
      setProfile(MemoryService.getProfile());
      MemoryService.clearAuditProgress();
    } catch {
      const fallbackMissions: MissionRecord[] = [
        { id: "msn_f1", action: "Switch to 100% renewable energy provider", difficulty: "medium", secondsBack: 21600, localContext: "Your regional grid has multiple green energy options available for immediate switch.", status: "pending" },
        { id: "msn_f2", action: "Replace all vehicle trips under 3km with walking/cycling", difficulty: "easy", secondsBack: 14400, localContext: "Short trips are the most emission-intensive per kilometer.", status: "pending" },
        { id: "msn_f3", action: "Eliminate beef and lamb from diet", difficulty: "hard", secondsBack: 28800, localContext: "Ruminant meat has the highest carbon footprint of all food sources.", status: "pending" }
      ];
      setMissions(fallbackMissions);
      MemoryService.saveProfile(createProfileObject(fallbackMissions));
      setProfile(MemoryService.getProfile());
      MemoryService.clearAuditProgress();
    } finally {
      setLoadingSwaps(false);
      setAuditDone(true);
      setShowBurnoutPopup(true);
    }
  };

  const handleCommit = (mission: MissionRecord, idx: number) => {
    const isCompleted = mission.status === "completed";
    const nextStatus = isCompleted ? "pending" : "completed";
    
    const newMissions = [...missions];
    newMissions[idx] = { 
      ...mission, 
      status: nextStatus,
      completedDate: nextStatus === "completed" ? new Date().toISOString() : undefined
    };
    
    setMissions(newMissions);
    if (profile) {
      const newProfile = { ...profile, missions: newMissions };
      MemoryService.saveProfile(newProfile);
      setProfile(MemoryService.getProfile());
    }

    if (nextStatus === "completed") {
      setFloatingRestore({ id: mission.id, seconds: mission.secondsBack, key: Date.now() });
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
    const totalRestored = missions.filter(m => m.status === "completed").reduce((sum, m) => sum + m.secondsBack, 0);

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
    ctx.fillStyle = "#dddddd";
    ctx.font = "italic 400 22px 'Times New Roman', Times, serif";
    ctx.fillText("This is to formally declare that the target region of", 600, 270);

    // City
    ctx.fillStyle = goldColor;
    ctx.font = "600 52px 'IBM Plex Sans', sans-serif";
    ctx.fillText(city.toUpperCase(), 600, 340);

    // Sub-text
    ctx.fillStyle = "#dddddd";
    ctx.font = "italic 400 22px 'Times New Roman', Times, serif";
    if (isPositive) {
      ctx.fillText("has successfully reclaimed carbon budget and delayed the point of no return.", 600, 400);
    } else {
      ctx.fillText("has actively worsened their carbon deficit and accelerated the point of no return.", 600, 400);
    }

    // The Big Number / Recovery Metrics
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
    ctx.fillStyle = "#999999";
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

    ctx.fillStyle = "#999999";
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
          aria-label="Next step: Evidence"
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
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, color: bar.color, letterSpacing: 1, textShadow: `0 0 8px ${bar.color}44` }}>{bar.pct}%</span>
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
          onClick={() => setTab("TIMELINE")}
          style={{ width: isMobile ? "100%" : "auto", padding: "12px 32px" }}
          aria-label="Next step: Timeline"
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

  const renderAudit = () => {
    if (showBriefing && catIdx === 0 && qIdx === 0) {
      return (
        <div style={{ flex: 1, padding: isMobile ? "24px 16px" : "40px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div className="doc-label" style={{ color: "#ffaa00", marginBottom: 16 }}>PERSONAL CLIMATE ASSESSMENT</div>
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
          <button className="btn-ghost" onClick={() => setTab("VERDICT")} aria-label="View Verdict">
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
                onClick={() => {
                  setCatIdx(0);
                  setQIdx(0);
                  setAnswers({});
                  setAuditDone(false);
                  setMissions([]);
                  MemoryService.clearAuditProgress();
                }}
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

  const getThreatLevel = (burnRate: number) => {
    if (burnRate > 8000) return "OMEGA-0 TERMINAL";
    if (burnRate > 5000) return "ALPHA-1 CRITICAL";
    if (burnRate > 2000) return "BETA-2 CONCERNING";
    if (burnRate > 500) return "GAMMA-3 ELEVATED";
    return "DELTA-4 STABLE";
  };

  const renderVerdict = () => {
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

      {/* FINAL BUREAU ASSESSMENT (Task 5) & THREAT EVOLUTION (Task 4) */}
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
        onClick={() => handleTabChange("ARCHIVE")}
        aria-label="View Archived Intelligence"
      >
        VIEW ARCHIVED INTELLIGENCE
      </button>
    </div>
  );
  };

  const renderArchive = () => {
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
  };

  // ── NAV ITEMS ──
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
                  onClick={() => handleTabChange(item.id)}
                  aria-label={`Switch to ${item.label} tab`}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 16,
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
                    <span style={{ color: "#ff4444", marginLeft: 4, fontSize: 9 }}>
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
                  onClick={() => handleTabChange(item.id)}
                  className={`nav-item${isActive ? " active" : ""}`}
                  aria-label={`Switch to ${item.label} tab`}
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
              {tab === "ARCHIVE" && renderArchive()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
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
