"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// Fixed breach date: 2033-06-11
const BREACH_DATE = new Date("2033-06-11T00:00:00Z");

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState({ yrs: 0, days: 0, hh: "00", mm: "00", ss: "00" });

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const diff = BREACH_DATE.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft({ yrs: 0, days: 0, hh: "00", mm: "00", ss: "00" });
        return;
      }
      const totalSeconds = Math.floor(diff / 1000);
      const yrs = Math.floor(totalSeconds / (365.25 * 24 * 3600));
      const rem = totalSeconds - yrs * Math.floor(365.25 * 24 * 3600);
      const days = Math.floor(rem / (24 * 3600));
      const rem2 = rem - days * 24 * 3600;
      const hh = String(Math.floor(rem2 / 3600)).padStart(2, "0");
      const mm = String(Math.floor((rem2 % 3600) / 60)).padStart(2, "0");
      const ss = String(rem2 % 60).padStart(2, "0");
      setTimeLeft({ yrs, days, hh, mm, ss });
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  return timeLeft;
}

const TICKER_CONTENT =
  "MUMBAI: CRITICAL · DELHI: CRITICAL · BEIJING: SEVERE · LONDON: HIGH · SÃO PAULO: CRITICAL · LAGOS: SEVERE · TOKYO: HIGH · NEW YORK: CRITICAL · JAKARTA: SEVERE · BANGALORE: CRITICAL · KARACHI: CRITICAL · CAIRO: HIGH · ";

const SUGGESTIONS = [
  "CALIFORNIA", "TEXAS", "NEW YORK", "FLORIDA", "ILLINOIS",
  "MAHARASHTRA", "KARNATAKA", "DELHI", "GUJARAT", "TAMIL NADU", "TELANGANA", "KERALA",
  "MUMBAI", "BANGALORE", "HYDERABAD", "CHENNAI", "PUNE", "KOLKATA", "JAIPUR",
  "LONDON", "PARIS", "TOKYO", "BEIJING", "SYDNEY", "DUBAI", "SINGAPORE",
  "INDIA", "UNITED STATES", "UNITED KINGDOM", "CHINA", "AUSTRALIA", "BRAZIL", "CANADA", "GERMANY"
];

function LandingPageContent() {
  const router = useRouter();
  const [isLanding, setIsLanding] = useState(true);
  
  const [city, setCity] = useState("");
  const [focused, setFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const { yrs, days, hh, mm, ss } = useCountdown();
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [city]);

  useEffect(() => {
    if (isLanding) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter") setIsLanding(false);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isLanding]);

  const filteredSuggestions = SUGGESTIONS.filter(
    (s) => city.trim() && s.toLowerCase().startsWith(city.trim().toLowerCase())
  );

  // Format today's date
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ".");

  const handleRetrieve = () => {
    const trimmed = city.trim();
    if (!trimmed) return;
    localStorage.setItem("dc_city", trimmed);
    router.push("/scanning");
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredSuggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (showSuggestions && selectedIndex >= 0 && selectedIndex < filteredSuggestions.length) {
        const selected = filteredSuggestions[selectedIndex];
        setCity(selected);
        setShowSuggestions(false);
        const trimmed = selected.trim();
        if (trimmed) {
          localStorage.setItem("dc_city", trimmed);
          router.push("/scanning");
        }
      } else {
        handleRetrieve();
      }
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: "0 32px 32px 32px",
        overflowX: "hidden",
        backgroundImage: "radial-gradient(circle at center, transparent 0%, #030303 100%), linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)",
        backgroundSize: "100% 100%, 40px 40px, 40px 40px",
        backgroundPosition: "center center",
      }}
    >
      {/* ── TOP HEADER BAR ── */}
      <div
        style={{
          borderBottom: "1px solid #1a1a1a",
          padding: "10px 0",
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
          position: "relative",
          zIndex: 9005, // Bring above vignette overlay
        }}
      >
        <div style={{ flex: 1, display: "flex" }} />
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            color: "#ffffff", // Brightened from #a0a0a0
            letterSpacing: 3,
            textTransform: "uppercase",
            textShadow: "0 0 5px rgba(255,255,255,0.3)",
            textAlign: "center"
          }}
        >
          CLIMATE INTELLIGENCE BUREAU · RESTRICTED ACCESS
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, justifyContent: "flex-end" }}>
          <span className="live-dot" />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              color: "#ff4444",
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            LIVE FEED ACTIVE
          </span>
        </div>
      </div>

      <div style={{ flex: 1, position: "relative" }}>
        <AnimatePresence>
          {isLanding ? (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.4 } }}
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                background: "radial-gradient(circle at center, transparent 0%, #050505 100%)"
              }}
              onClick={() => setIsLanding(false)}
            >
              {/* Boot sequence top-left */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.1 }}
                style={{
                  position: "absolute",
                  top: 24,
                  left: 24,
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: "#ff4444",
                  lineHeight: 1.6,
                  letterSpacing: 2,
                  opacity: 0.6
                }}
              >
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>[ SYSTEM BOOT ] ... SUCCESS</motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>[ ESTABLISHING SECURE CONNECTION ] ... OK</motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>[ DECRYPTING TERMINAL ] ... DONE</motion.div>
              </motion.div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                <motion.div
                  layoutId="title-death"
                  transition={{ type: "tween", ease: "easeInOut", duration: 0.6 }}
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "clamp(80px, 15vw, 150px)",
                    fontWeight: 600,
                    letterSpacing: -2,
                    lineHeight: 0.92,
                    color: "#ffffff",
                    textTransform: "uppercase",
                    textAlign: "center",
                    textShadow: "0 0 40px rgba(255,255,255,0.15)"
                  }}
                >
                  DEATH
                </motion.div>
                <motion.div
                  layoutId="title-clock"
                  transition={{ type: "tween", ease: "easeInOut", duration: 0.6 }}
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "clamp(80px, 15vw, 150px)",
                    fontWeight: 600,
                    letterSpacing: -2,
                    lineHeight: 0.92,
                    color: "#ff4444",
                    textTransform: "uppercase",
                    textAlign: "center",
                    textShadow: "0 0 40px rgba(255,68,68,0.25)"
                  }}
                >
                  CLOCK
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                transition={{ delay: 0.7, duration: 1 }}
                style={{
                  marginTop: 60,
                  fontFamily: "var(--font-mono)",
                  fontSize: 14,
                  color: "#ffffff",
                  letterSpacing: 4,
                  textTransform: "uppercase",
                  textShadow: "0 0 10px rgba(255,255,255,0.4)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  padding: "12px 24px",
                  background: "rgba(255,255,255,0.03)"
                }}
              >
                [ PRESS ENTER TO INITIATE ]
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="dossier"
              onScroll={(e) => setHasScrolled(e.currentTarget.scrollTop > 50)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              style={{ 
                position: "absolute",
                inset: 0,
                display: "flex", 
                flexDirection: "column",
                pointerEvents: isLanding ? "none" : "auto",
                overflowY: "auto",
                paddingBottom: 20
              }}
            >
              {/* ── DOCUMENT META ROW ── */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{
                  padding: "12px 0",
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  color: "#a0a0a0",
                  letterSpacing: 1,
                  lineHeight: 2.2,
                  borderBottom: "1px solid #111",
                }}
              >
                <span style={{ color: "#888880" }}>DOCUMENT CLASS: </span>
                <span style={{ color: "#ff4444" }}>TOP SECRET</span>
                <span style={{ color: "#888880" }}>
                  {" "}
                  · REF: CIB-2026-CARBON-∞ · ISSUED: {dateStr} · STATUS:{" "}
                </span>
                <span style={{ color: "#ff4444" }}>CRITICAL</span>
              </motion.div>

              {/* ── MAIN BODY ── */}
              <div style={{ flex: 1, paddingTop: 8 }}>
                {/* ── TITLE BLOCK ── */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <div>
                    <motion.div
                      layoutId="title-death"
                      transition={{ type: "tween", ease: "easeInOut", duration: 0.6 }}
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "clamp(52px, 8vw, 72px)",
                        fontWeight: 600,
                        letterSpacing: -2,
                        lineHeight: 0.92,
                        color: "#ffffff",
                        textTransform: "uppercase",
                        transformOrigin: "top left"
                      }}
                    >
                      DEATH
                    </motion.div>
                    <motion.div
                      layoutId="title-clock"
                      transition={{ type: "tween", ease: "easeInOut", duration: 0.6 }}
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "clamp(52px, 8vw, 72px)",
                        fontWeight: 600,
                        letterSpacing: -2,
                        lineHeight: 0.92,
                        color: "#ff4444",
                        textTransform: "uppercase",
                        marginBottom: 10,
                        transformOrigin: "top left"
                      }}
                    >
                      CLOCK
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        color: "#a0a0a0",
                        letterSpacing: 3,
                        textTransform: "uppercase",
                        marginTop: 10,
                      }}
                    >
                      CARBON COUNTDOWN INTELLIGENCE SYSTEM
                    </motion.div>
                  </div>

                  {/* Stamps */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 8,
                      paddingTop: 6,
                    }}
                    className="stamps-block"
                  >
                    <div
                      style={{
                        transform: "rotate(-8deg)",
                        border: "2px solid #ff4444",
                        color: "#ff4444",
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: 4,
                        padding: "4px 10px",
                        borderRadius: 2,
                        textTransform: "uppercase",
                        lineHeight: 1,
                        display: "inline-block",
                      }}
                    >
                      CLASSIFIED
                    </div>
                    <div
                      style={{
                        transform: "rotate(4deg)",
                        border: "2px solid #00cc66",
                        color: "#00cc66",
                        fontFamily: "var(--font-mono)",
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: 3,
                        padding: "3px 8px",
                        borderRadius: 2,
                        textTransform: "uppercase",
                        lineHeight: 1,
                        display: "inline-block",
                        marginTop: 8,
                      }}
                    >
                      LIVE DATA
                    </div>
                  </motion.div>
                </div>

                {/* ── DOCUMENT BODY: 2-col grid ── */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  style={{
                    display: "grid",
                    gridTemplateColumns: isLanding ? "1fr" : "1fr 1fr",
                    gap: 16,
                    marginTop: 12,
                    marginBottom: 12,
                  }}
                  className="doc-grid"
                >
                  {/* LEFT COLUMN - TERMINAL MODULE */}
                  <div style={{ border: "1px solid #1a1a1a", background: "#050505", position: "relative", padding: "24px", display: "flex", flexDirection: "column", gap: 24 }}>
                    {/* Corner brackets */}
                    <div style={{ position: "absolute", top: 0, left: 0, width: 8, height: 8, borderTop: "2px solid #555", borderLeft: "2px solid #555", zIndex: 2 }} />
                    <div style={{ position: "absolute", top: 0, right: 0, width: 8, height: 8, borderTop: "2px solid #555", borderRight: "2px solid #555", zIndex: 2 }} />
                    <div style={{ position: "absolute", bottom: 0, left: 0, width: 8, height: 8, borderBottom: "2px solid #555", borderLeft: "2px solid #555", zIndex: 2 }} />
                    <div style={{ position: "absolute", bottom: 0, right: 0, width: 8, height: 8, borderBottom: "2px solid #555", borderRight: "2px solid #555", zIndex: 2 }} />

                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div className="doc-label" style={{ color: "#aaaaaa" }}>SUBJECT</div>
                      <div className="doc-value" style={{ color: "#ffffff", fontSize: 16 }}>GLOBAL CARBON BUDGET DEPLETION</div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div className="doc-label" style={{ color: "#aaaaaa", display: "flex", alignItems: "center", gap: 6 }}>
                        <span className="live-dot" style={{ width: 4, height: 4 }} /> CRITICAL THRESHOLD
                      </div>
                      <div className="doc-value" style={{ color: "#ff4444", fontSize: 16, textShadow: "0 0 10px rgba(255,68,68,0.3)" }}>1.5°C — POINT OF NO RETURN</div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div className="doc-label" style={{ color: "#aaaaaa" }}>BUDGET REMAINING</div>
                      <div className="doc-value" style={{ color: "#ffaa00", fontSize: 16, textShadow: "0 0 10px rgba(255,170,0,0.2)" }}>4.2 TRILLION TONNES CO₂</div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6, borderTop: "1px solid #1a1a1a", paddingTop: 16, marginTop: "auto" }}>
                      <div className="doc-label" style={{ color: "#aaaaaa" }}>ESTIMATED BREACH</div>
                      <div
                        className="doc-value"
                        style={{
                          color: "#ff4444",
                          fontSize: 20,
                          fontVariantNumeric: "tabular-nums",
                          letterSpacing: 2,
                          textShadow: "0 0 15px rgba(255,68,68,0.4)"
                        }}
                      >
                        {yrs} YRS · {days} DAYS · {hh}:{mm}:{ss}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN - TERMINAL MODULE */}
                  <div style={{ border: "1px solid #1a1a1a", background: "#050505", position: "relative", padding: "24px", display: "flex", flexDirection: "column", gap: 24 }}>
                    {/* Corner brackets */}
                    <div style={{ position: "absolute", top: 0, left: 0, width: 8, height: 8, borderTop: "2px solid #555", borderLeft: "2px solid #555", zIndex: 2 }} />
                    <div style={{ position: "absolute", top: 0, right: 0, width: 8, height: 8, borderTop: "2px solid #555", borderRight: "2px solid #555", zIndex: 2 }} />
                    <div style={{ position: "absolute", bottom: 0, left: 0, width: 8, height: 8, borderBottom: "2px solid #555", borderLeft: "2px solid #555", zIndex: 2 }} />
                    <div style={{ position: "absolute", bottom: 0, right: 0, width: 8, height: 8, borderBottom: "2px solid #555", borderRight: "2px solid #555", zIndex: 2 }} />

                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div className="doc-label" style={{ color: "#aaaaaa" }}>COVERAGE</div>
                      <div className="doc-value" style={{ color: "#cccccc" }}>195 COUNTRIES · ALL INDIAN STATES</div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div className="doc-label" style={{ color: "#aaaaaa" }}>ANALYST</div>
                      <div className="doc-value">
                        <span className="redacted" style={{ width: 120 }} />
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div className="doc-label" style={{ color: "#aaaaaa" }}>AUTHORIZATION</div>
                      <div className="doc-value">
                        <span className="redacted" style={{ width: 90 }} />
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6, borderTop: "1px solid #1a1a1a", paddingTop: 16, marginTop: "auto" }}>
                      <div className="doc-label" style={{ color: "#aaaaaa", display: "flex", alignItems: "center", gap: 6 }}>
                        <span className="live-dot-green" style={{ width: 4, height: 4 }} /> ACCESS GRANTED TO
                      </div>
                      <div className="doc-value" style={{ color: "#00cc66", textShadow: "0 0 10px rgba(0,204,102,0.3)" }}>PUBLIC — YOU ARE HERE</div>
                    </div>
                  </div>
                </motion.div>

                {/* ── REQUEST DOSSIER SECTION ── */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  style={{
                    borderTop: "1px solid #1a1a1a",
                    paddingTop: 24,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      color: "#ff4444",
                      letterSpacing: 4,
                      textTransform: "uppercase",
                      marginBottom: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      textShadow: "0 0 10px rgba(255,68,68,0.2)"
                    }}
                  >
                    <span className="live-dot" style={{ width: 5, height: 5 }} /> REQUEST CITY DOSSIER
                  </div>

                  {/* Input row */}
                  <div
                    style={{
                      position: "relative",
                      display: "flex",
                      border: `1px solid ${focused ? "#ff4444" : "#333333"}`,
                      background: "#080808",
                      width: "100%",
                      maxWidth: 520,
                      transition: "all 200ms ease-in-out",
                      boxShadow: focused ? "0 0 20px rgba(255,68,68,0.15)" : "0 0 0 transparent",
                    }}
                  >
                    {/* Subtle corner accents */}
                    <div style={{ position: "absolute", top: -1, left: -1, width: 6, height: 6, borderTop: "2px solid #ff4444", borderLeft: "2px solid #ff4444", zIndex: 2, opacity: focused ? 1 : 0.3 }} />
                    <div style={{ position: "absolute", bottom: -1, right: -1, width: 6, height: 6, borderBottom: "2px solid #ff4444", borderRight: "2px solid #ff4444", zIndex: 2, opacity: focused ? 1 : 0.3 }} />

                    {/* QUERY_ prefix */}
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        color: focused ? "#ff4444" : "#888888",
                        padding: "0 16px",
                        display: "flex",
                        alignItems: "center",
                        borderRight: "1px solid #1a1a1a",
                        flexShrink: 0,
                        letterSpacing: 2,
                        transition: "color 200ms"
                      }}
                    >
                      QUERY_
                    </div>

                    {/* Input field */}
                    <input
                      ref={inputRef}
                      type="text"
                      value={city}
                      onChange={(e) => { setCity(e.target.value); setShowSuggestions(true); }}
                      onKeyDown={handleKey}
                      onFocus={() => { setFocused(true); setShowSuggestions(true); }}
                      onBlur={() => { setFocused(false); setShowSuggestions(false); }}
                      placeholder="ENTER STATE, REGION, OR COUNTRY..."
                      autoComplete="new-password"
                      spellCheck={false}
                      autoCorrect="off"
                      autoCapitalize="off"
                      style={{
                        flex: 1,
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        color: "#ffffff",
                        fontFamily: "var(--font-mono)",
                        fontSize: 18,
                        padding: "16px",
                        letterSpacing: 2,
                        textTransform: "uppercase",
                        minWidth: 0,
                      }}
                    />

                    {/* RETRIEVE button */}
                    <button
                      onClick={handleRetrieve}
                      style={{
                        background: focused ? "#ff4444" : "#ff4444cc",
                        color: "#000",
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: 3,
                        padding: "0 24px",
                        border: "none",
                        flexShrink: 0,
                        transition: "all 150ms",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                        boxShadow: "inset 0 0 10px rgba(0,0,0,0.2)"
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLButtonElement;
                        el.style.background = "#ff6666";
                        el.style.boxShadow = "inset 0 0 5px rgba(0,0,0,0.1)";
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLButtonElement;
                        el.style.background = focused ? "#ff4444" : "#ff4444cc";
                        el.style.boxShadow = "inset 0 0 10px rgba(0,0,0,0.2)";
                      }}
                    >
                      RETRIEVE ›
                    </button>

                    {/* Suggestions Dropdown */}
                    {showSuggestions && filteredSuggestions.length > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: -1,
                          right: -1,
                          background: "#080808",
                          border: "1px solid #ff444433",
                          borderTop: "none",
                          maxHeight: 200,
                          overflowY: "auto",
                          zIndex: 100,
                          display: "flex",
                          flexDirection: "column",
                          marginTop: 2,
                        }}
                      >
                        {filteredSuggestions.map((s, i) => (
                          <div
                            key={s}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setCity(s);
                              setShowSuggestions(false);
                            }}
                            style={{
                              padding: "12px 14px",
                              fontFamily: "var(--font-mono)",
                              fontSize: 14,
                              color: "#ffffff",
                              cursor: "pointer",
                              borderBottom: i === filteredSuggestions.length - 1 ? "none" : "1px solid #141414",
                              background: i === selectedIndex ? "#ff44441a" : "transparent",
                            }}
                            onMouseEnter={(e) => {
                              setSelectedIndex(i);
                            }}
                            onMouseLeave={(e) => {
                              if (selectedIndex === i) setSelectedIndex(-1);
                            }}
                          >
                            {s}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Disclaimer */}
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 8,
                      color: "#888880",
                      lineHeight: 2,
                      marginTop: 12,
                      textAlign: "center",
                    }}
                  >
                    <div>
                      // ACCESS AUTHORIZED · DATA CLASSIFIED UNDER CLIMATE EMERGENCY ACT
                      2026
                    </div>
                    <div>
                      // MISUSE OF THIS INFORMATION CONSTITUTES A CRIMINAL OFFENCE
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!isLanding && !hasScrolled && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.5, delay: 1 }}
              style={{
                position: "absolute",
                bottom: 20,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 9999,
                pointerEvents: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "rgba(255, 68, 68, 0.1)",
                  border: "1px solid rgba(255, 68, 68, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 20px rgba(255, 68, 68, 0.15)",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M19 12l-7 7-7-7"/>
                </svg>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── TICKER BAR ── */}
      <div
        style={{
          borderTop: "1px solid #1a0000",
          borderBottom: "1px solid #1a0000",
          background: "#080000",
          padding: "6px 0",
          overflow: "hidden",
          flexShrink: 0,
          marginTop: 16,
          marginLeft: -32,
          marginRight: -32,
          position: "relative",
          zIndex: 9005, // Bring above vignette overlay
        }}
      >
        <div className="ticker-track">
          {[TICKER_CONTENT, TICKER_CONTENT].map((t, i) => (
            <span
              key={i}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 8,
                color: "#ff4444",
                letterSpacing: 2,
                paddingRight: 40,
                flexShrink: 0,
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Inline responsive CSS */}
      <style>{`
        @media (max-width: 768px) {
          .stamps-block { flex-direction: row !important; padding-top: 16px !important; }
          .doc-grid { grid-template-columns: 1fr !important; gap: 0 !important; }
        }
        input::placeholder { color: #333333 !important; }
      `}</style>
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={null}>
      <LandingPageContent />
    </Suspense>
  );
}
