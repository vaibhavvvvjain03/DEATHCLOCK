"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { QUESTION_BANK, CATEGORY_NAMES, CATEGORY_KEYS } from "@/lib/questions";

// Flatten all questions in order
const ALL_QUESTIONS = CATEGORY_KEYS.flatMap((key, catIdx) =>
  QUESTION_BANK[key].map((q) => ({ ...q, category: key, catIdx, catName: CATEGORY_NAMES[catIdx] }))
);
const TOTAL = ALL_QUESTIONS.length; // 30

const FINAL_TEXTS = [
  "> ATMOSPHERIC AUDIT COMPLETE",
  "> ANALYZING HIGHEST IMPACT INTERVENTIONS...",
  "> CROSS-REFERENCING LOCAL INFRASTRUCTURE...",
  "> GENERATING MISSION BRIEF...",
  "> COMPILING PERSONAL VERDICT...",
];

export default function AuditPage() {
  const params = useParams();
  const router = useRouter();
  const city = (params.city as string || "city").toUpperCase();

  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [burnRate, setBurnRate] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [typewriterText, setTypewriterText] = useState("");
  const [showProcessing, setShowProcessing] = useState(false);
  const [catTransition, setCatTransition] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [loadingFinal, setLoadingFinal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [finalTextIdx, setFinalTextIdx] = useState(0);
  const twRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasMounted = useRef(false);

  const currentQ = ALL_QUESTIONS[qIdx];
  const catName = currentQ.catName;
  const isLastInCat =
    qIdx + 1 >= TOTAL ||
    ALL_QUESTIONS[qIdx + 1].catIdx !== currentQ.catIdx;
  const isLastQ = qIdx === TOTAL - 1;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Final loading screen animation
  useEffect(() => {
    if (!loadingFinal) return;
    const t = setInterval(() => {
      setFinalTextIdx((i) => Math.min(i + 1, FINAL_TEXTS.length - 1));
    }, 500);
    return () => clearInterval(t);
  }, [loadingFinal]);

  // Typewriter effect
  const startTypewriter = useCallback((text: string) => {
    if (twRef.current) clearTimeout(twRef.current);
    setTypewriterText("");
    const speed = isMobile ? 15 : 20;
    let i = 0;
    const tick = () => {
      setTypewriterText(text.slice(0, i + 1));
      i++;
      if (i < text.length) {
        twRef.current = setTimeout(tick, speed);
      }
    };
    tick();
  }, [isMobile]);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      const storedCity = localStorage.getItem("dc_city");
      if (!storedCity) router.push("/");
    }
    startTypewriter(currentQ.question);
    setSelectedOpt(null);
    setShowProcessing(false);
  }, [qIdx]);

  const handleSelect = (optValue: string, burnRateDelta: number) => {
    if (processing || selectedOpt) return;
    setSelectedOpt(optValue);

    const newAnswers = { ...answers, [currentQ.id]: optValue };
    const newBurnRate = burnRate + burnRateDelta;
    setAnswers(newAnswers);
    setBurnRate(newBurnRate);
    localStorage.setItem("dc_answers", JSON.stringify(newAnswers));
    localStorage.setItem("dc_burnrate", String(newBurnRate));

    setShowProcessing(true);
    setProcessing(true);

    // After 600ms, advance
    setTimeout(() => {
      setShowProcessing(false);
      setProcessing(false);

      if (isLastQ) {
        // Done — go to loading
        setLoadingFinal(true);
        callSwapsAPI(newAnswers, newBurnRate);
      } else if (isLastInCat) {
        // Category transition
        setCatTransition(true);
        setTimeout(() => {
          setCatTransition(false);
          setQIdx((q) => q + 1);
        }, 1500);
      } else {
        setQIdx((q) => q + 1);
      }
    }, 600);
  };

  const callSwapsAPI = async (allAnswers: Record<string, string>, personalDailySeconds: number) => {
    try {
      const res = await fetch("/api/swaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cityName: city,
          allAnswers,
          personalDailySeconds,
        }),
      });
      const data = await res.json();
      if (data.swaps) {
        localStorage.setItem("dc_swaps", JSON.stringify(data.swaps));
      }
    } catch {
      // Fallback swaps
      localStorage.setItem("dc_swaps", JSON.stringify([
        { action: "Switch to a renewable energy provider", secondsBack: 15000, difficulty: "medium", localContext: `Look for local green energy co-ops in ${city}.` },
        { action: "Reduce red meat consumption to once a week", secondsBack: 8000, difficulty: "easy", localContext: `Explore the local plant-based food scene in ${city}.` },
        { action: "Replace 3 car trips a week with transit or biking", secondsBack: 5000, difficulty: "medium", localContext: `Utilize the public transit network in ${city}.` },
      ]));
    }
    // Navigate to dossier verdict tab
    setTimeout(() => router.push("/dossier?tab=verdict"), 2000);
  };

  const progress = (qIdx / TOTAL) * 100;
  const nextCatName = isLastInCat && !isLastQ
    ? ALL_QUESTIONS[qIdx + 1]?.catName
    : null;

  // Category transition screen
  if (catTransition) {
    return (
      <div
        className="page-full"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ textAlign: "center" }}
        >
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 24,
              color: "var(--c-accent)",
              marginBottom: 12,
            }}
          >
            ✓ {catName} COMPLETE
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "#1a4a1a",
              letterSpacing: 3,
            }}
          >
            ADVANCING TO {nextCatName} ›
          </div>
        </motion.div>
      </div>
    );
  }



  if (loadingFinal) {
    return (
      <div
        className="page-full"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          gap: 16,
        }}
      >
        {FINAL_TEXTS.slice(0, finalTextIdx + 1).map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "#1a4a1a",
              letterSpacing: 2,
            }}
          >
            {t}
          </motion.div>
        ))}
      </div>
    );
  }

  const PROC_LINES = [
    "> PROCESSING INPUT...",
    "> CALCULATING DELTA...",
    "> UPDATING TIMELINE...",
  ];

  // Category dots (6 categories)
  const catProgress = CATEGORY_KEYS.map((key, ci) => {
    const catQs = ALL_QUESTIONS.filter((q) => q.catIdx === ci);
    const answered = catQs.filter((q) => answers[q.id]).length;
    if (ci < currentQ.catIdx) return "done";
    if (ci === currentQ.catIdx) return "active";
    return "pending";
  });

  return (
    <div
      className="page-full"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <h1 className="sr-only">Audit Form: {city}</h1>
      {/* Top bar */}
      <div
        style={{
          height: 44,
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          borderBottom: "1px solid #0a1a0a",
          gap: 16,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            color: "#1a3a1a",
            letterSpacing: 2,
            flexShrink: 0,
          }}
        >
          PERSONAL AUDIT · {city}
        </span>

        {/* Progress track */}
        <div style={{ flex: 1, height: 1, background: "#050f05", borderRadius: 1, overflow: "hidden" }}>
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{ height: "100%", background: "var(--c-accent)" }}
          />
        </div>

        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            color: "#1a3a1a",
            flexShrink: 0,
          }}
        >
          Q {qIdx + 1}/{TOTAL}
        </span>
      </div>

      {/* Main area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "stretch" : "center",
          justifyContent: "center",
          padding: isMobile ? "24px 20px 100px" : "0 48px 80px",
          gap: 32,
          overflowY: "auto",
          minHeight: 0,
        }}
      >
        {/* Question column */}
        <div style={{ flex: 1, maxWidth: 520 }}>
          {/* Category label */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div style={{ flex: "0 0 12px", height: 1, background: "var(--c-accent)" }} />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 8,
                color: "var(--c-accent)",
                letterSpacing: 4,
                textTransform: "uppercase",
              }}
            >
              {catName}
            </span>
          </div>

          {/* Question text with typewriter */}
          <AnimatePresence mode="wait">
            <motion.h2
              key={qIdx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: isMobile ? 18 : 22,
                fontWeight: 500,
                color: "#e0ffe0",
                lineHeight: 1.45,
                maxWidth: 520,
                marginBottom: 24,
                minHeight: "2.9em",
              }}
            >
              {typewriterText}
              <span
                style={{
                  display: "inline-block",
                  width: 2,
                  height: "1em",
                  background: "var(--c-accent)",
                  marginLeft: 2,
                  animation: "blink 1s step-end infinite",
                  verticalAlign: "text-bottom",
                }}
              />
            </motion.h2>
          </AnimatePresence>

          {/* Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {currentQ.options.map((opt, oi) => {
              const letter = String.fromCharCode(65 + oi);
              const isSelected = selectedOpt === opt.value;

              return (
                <motion.button
                  key={opt.value}
                  onClick={() => handleSelect(opt.value, opt.burnRate)}
                  disabled={!!selectedOpt}
                  aria-label={`Select option ${letter}: ${opt.label.replace(/^> /, "")}`}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: oi * 0.05 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    minHeight: 48,
                    border: `1px solid ${isSelected ? "#00ff4155" : "#0a1a0a"}`,
                    borderLeft: `${isSelected ? "2" : "1"}px solid ${isSelected ? "var(--c-accent)" : "#0a1a0a"}`,
                    borderRadius: isSelected ? "0 2px 2px 0" : 2,
                    background: isSelected ? "#00ff4110" : "transparent",
                    width: "100%",
                    textAlign: "left",
                    cursor: "none",
                    transition: "all 150ms",
                  }}
                  onMouseEnter={(e) => {
                    if (!selectedOpt) {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.borderColor = "#00ff4133";
                      el.style.borderLeftColor = "var(--c-accent)";
                      el.style.borderLeftWidth = "2px";
                      el.style.borderRadius = "0 2px 2px 0";
                      el.style.background = "#00ff4108";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedOpt) {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.borderColor = "#0a1a0a";
                      el.style.borderLeftColor = "#0a1a0a";
                      el.style.borderLeftWidth = "1px";
                      el.style.borderRadius = "2px";
                      el.style.background = "transparent";
                    }
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 9,
                      color: isSelected ? "#00ff4166" : "#1a3a1a",
                      minWidth: 20,
                      flexShrink: 0,
                    }}
                  >
                    {letter}.
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: isSelected ? "var(--c-accent)" : "#2a5a2a",
                      flex: 1,
                      lineHeight: 1.4,
                    }}
                  >
                    {opt.label.replace(/^> /, "")}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: isSelected ? "#00ff4133" : "#0d2a0d",
                      flexShrink: 0,
                    }}
                  >
                    {isSelected ? "LOGGED ✓" : "↵"}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Processing lines */}
          <AnimatePresence>
            {showProcessing && (
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 4 }}>
                {PROC_LINES.map((line, i) => (
                  <motion.div
                    key={line}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.15 }}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      color: "#1a4a1a",
                      letterSpacing: 1,
                    }}
                  >
                    {line}
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Burn rate (right side on desktop, below on mobile) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: isMobile ? "flex-start" : "flex-end",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: isMobile ? 16 : 0,
          }}
        >
          <motion.div
            key={burnRate}
            initial={{ scale: 1.05, color: "#ff6666" }}
            animate={{ scale: 1, color: "#ff4444" }}
            transition={{ duration: 0.3 }}
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 32,
              fontWeight: 700,
              color: "#ff4444",
              lineHeight: 1,
            }}
          >
            {burnRate > 0 ? `-${burnRate.toLocaleString()}` : "0"}
          </motion.div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 8,
              color: "#1a3a1a",
              letterSpacing: 3,
              marginTop: 4,
            }}
          >
            SECONDS / DAY
          </div>
        </div>
      </div>

      {/* Bottom bar — category dots */}
      <div
        style={{
          height: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          borderTop: "1px solid #0a1a0a",
          flexShrink: 0,
          paddingBottom: 4,
        }}
      >
        {catProgress.map((state, i) => (
          <div
            key={i}
            style={{
              width: state === "done" ? 20 : 5,
              height: 5,
              borderRadius: state === "done" ? 3 : "50%",
              background:
                state === "done" ? "var(--c-accent)" :
                state === "active" ? "#00ff4166" :
                "#0d2a0d",
              transition: "all 300ms ease",
            }}
          />
        ))}
      </div>

      {/* Blink keyframe */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
