"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Radar from "@/components/Radar";

const SCAN_LINES = [
  { label: "ACCESSING RECORD", value: "RECORD LOCATED", color: "#ffffff", delay: 150 },
  { label: "SUBJECT", value: "__CITY__", color: "#ffffff", delay: 300 },
  { label: "COUNTRY", value: "__COUNTRY__", color: "#ffffff", delay: 450 },
  { label: "STATUS", value: "◆ CRITICAL", color: "#ff4444", delay: 600 },
  { label: "CARBON BUDGET", value: "__BUDGET__", color: "#ffaa00", delay: 750 },
  { label: "SURVIVAL PROBABILITY", value: "__SURVIVAL__", color: "#ff4444", delay: 900 },
  { label: "ESTIMATED TIME LEFT", value: "__TIME__", color: "#ff4444", delay: 1050 },
  { label: "THREAT CLASS", value: "ALPHA-1 CRITICAL", color: "#ff4444", delay: 1200 },
  { label: "AUTHORIZATION", value: "PUBLIC · ACCESS GRANTED", color: "#00cc66", delay: 1350 },
];

const STATUS_TEXTS = [
  "INITIATING DEEP SCAN...",
  "LOCATING RECORD...",
  "ACCESSING DATABASE...",
  "DECRYPTING CLASSIFIED FILES...",
  "LOADING CARBON DATA...",
  "CALCULATING PROJECTIONS...",
  "ANALYZING THREAT LEVEL...",
  "COMPILING DOSSIER...",
  "ACCESS GRANTED — OPENING FILE",
];

function formatSecondsToTime(seconds: number): string {
  const yrs = Math.floor(seconds / (365.25 * 24 * 3600));
  const rem = seconds - yrs * Math.floor(365.25 * 24 * 3600);
  const days = Math.floor(rem / (24 * 3600));
  const rem2 = rem - days * 24 * 3600;
  const hh = String(Math.floor(rem2 / 3600)).padStart(2, "0");
  const mm = String(Math.floor((rem2 % 3600) / 60)).padStart(2, "0");
  const ss = String(rem2 % 60).padStart(2, "0");
  return `${yrs}Y ${days}D ${hh}:${mm}:${ss}`;
}

export default function ScanningPage() {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [revealedLines, setRevealedLines] = useState<number[]>([]);
  const [apiData, setApiData] = useState<any>(null);
  const [radarSize, setRadarSize] = useState(280);
  const [isMobile, setIsMobile] = useState(false);
  const navigated = useRef(false);

  const [fetchComplete, setFetchComplete] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);

  // Read city from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("dc_city") || "";
    if (!stored) {
      router.replace("/");
      return;
    }
    setCity(stored);
  }, [router]);

  // Responsive
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setRadarSize(mobile ? 200 : 280);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Fetch carbon data in background
  useEffect(() => {
    if (!city) return;
    fetch("/api/carbon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location: city }),
    })
      .then((r) => r.json())
      .then((data) => {
        setApiData(data);
        localStorage.setItem("dc_data", JSON.stringify(data));
      })
      .catch(() => {
        const fallback = {
          remainingBudgetTonnes: 600000000,
          annualEmissionRate: 50000000,
          secondsRemaining: 236520000,
          contextSentence: "Carbon telemetry is relying on fallback estimates.",
        };
        setApiData(fallback);
        localStorage.setItem("dc_data", JSON.stringify(fallback));
      })
      .finally(() => {
        setFetchComplete(true);
      });
  }, [city]);

  // Staggered line reveal
  useEffect(() => {
    if (!city) return;

    SCAN_LINES.forEach((_, idx) => {
      setTimeout(() => {
        setRevealedLines((prev) => {
          if (prev.includes(idx)) return prev;
          return [...prev, idx];
        });
      }, SCAN_LINES[idx].delay);
    });

    // Mark scan complete after all lines + 600ms
    const totalDelay = SCAN_LINES[SCAN_LINES.length - 1].delay + 600;
    const navTimer = setTimeout(() => {
      setScanComplete(true);
    }, totalDelay);

    return () => clearTimeout(navTimer);
  }, [city]);

  // Navigate when both scan and fetch are complete
  useEffect(() => {
    if (scanComplete && fetchComplete && !navigated.current) {
      navigated.current = true;
      router.push("/dossier");
    }
  }, [scanComplete, fetchComplete, router]);

  const progressPct =
    SCAN_LINES.length > 0
      ? (revealedLines.length / SCAN_LINES.length) * 100
      : 0;

  const statusText = STATUS_TEXTS[Math.min(revealedLines.length, STATUS_TEXTS.length - 1)];

  const getLineValue = (line: (typeof SCAN_LINES)[0]) => {
    if (line.value === "__CITY__") return apiData?.resolvedLocation?.toUpperCase() || city.toUpperCase();
    if (line.value === "__COUNTRY__") return apiData?.resolvedCountry?.toUpperCase() || "DETECTING...";
    if (line.value === "__BUDGET__") {
      if (apiData?.remainingBudgetTonnes) {
        return `${(apiData.remainingBudgetTonnes / 1e9).toFixed(1)}B TONNES CO₂`;
      }
      return "CALCULATING...";
    }
    if (line.value === "__SURVIVAL__") {
      return apiData ? "47%" : "ANALYZING...";
    }
    if (line.value === "__TIME__") {
      if (apiData?.secondsRemaining) {
        return formatSecondsToTime(apiData.secondsRemaining);
      }
      return "CALCULATING...";
    }
    return line.value;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0c0c0c",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: "stretch",
      }}
    >
      {/* ── LEFT: RADAR ── */}
      {!isMobile && (
        <div
          style={{
            width: "40%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            borderRight: "1px solid #111",
            padding: 32,
            gap: 20,
          }}
        >
          <Radar size={radarSize} />

          {/* Scanning label */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span className="live-dot" />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                color: "#444444",
                letterSpacing: 4,
                textTransform: "uppercase",
              }}
            >
              SCANNING {city.toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {/* Mobile radar (compact, top) */}
      {isMobile && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "24px 24px 12px",
            gap: 12,
          }}
        >
          <Radar size={200} />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="live-dot" />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                color: "#444444",
                letterSpacing: 4,
              }}
            >
              SCANNING {city.toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {/* ── RIGHT: SCAN DATA ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: isMobile ? "24px" : "48px 40px",
          minWidth: 0,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 24,
          }}
        >
          <span className="live-dot" />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              color: "#ff4444",
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            ◆ SCANNING {city.toUpperCase()}
          </span>
        </div>

        {/* Scan lines */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {SCAN_LINES.map((line, idx) => {
            const revealed = revealedLines.includes(idx);
            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  opacity: revealed ? 1 : 0.3,
                  transform: revealed ? "translateY(0)" : "translateY(5px)",
                  transition: "opacity 0.3s ease, transform 0.3s ease",
                }}
              >
                {/* Label */}
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 8,
                    color: "#555555",
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    flexShrink: 0,
                    minWidth: isMobile ? 130 : 160,
                    width: isMobile ? 130 : 160,
                  }}
                >
                  {line.label}
                </span>

                {/* Value or redacted */}
                {revealed ? (
                  <span
                    className="value-flash"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: line.color,
                      letterSpacing: 1,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {getLineValue(line)}
                  </span>
                ) : (
                  <span
                    className="redacted"
                    style={{ width: 100 + (idx * 17) % 60 }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 12 }}>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Status text */}
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 8,
            color: "#444444",
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          {statusText}
        </div>
      </div>
    </div>
  );
}
