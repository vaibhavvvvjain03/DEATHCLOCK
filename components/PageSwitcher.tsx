"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { motion } from "framer-motion";

const PAGES = [
  { label: "SYSTEM", path: "/" },
  { label: "DOSSIER", path: "/?dossier=true" },
  { label: "SCANNING", path: "/scanning" },
  { label: "REPORT", path: "/dossier" },
];

function PageSwitcherContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isDossier = searchParams.get("dossier") === "true";
  
  let activeIndex = PAGES.findIndex((p) => {
    if (pathname === "/") {
      if (isDossier && p.path === "/?dossier=true") return true;
      if (!isDossier && p.path === "/") return true;
      return false;
    }
    return p.path === pathname;
  });

  if (activeIndex === -1) activeIndex = 0;

  useEffect(() => {
    const navEntries = performance.getEntriesByType("navigation");
    if (navEntries.length > 0 && (navEntries[0] as PerformanceNavigationTiming).type === "reload") {
      localStorage.removeItem("dc_city");
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }
  }, []);

  const navigate = (path: string) => {
    const city = localStorage.getItem("dc_city");
    if (!city && path !== "/" && path !== "/?dossier=true") {
      setError("ENTER CITY OR STATE NAME FIRST");
      setTimeout(() => setError(null), 3000);
      return;
    }
    router.push(path);
  };

  return (
    <>
      {/* Right nav dots */}
      <div
        style={{
          position: "fixed",
          right: 24,
          top: "50%",
          transform: "translateY(-50%)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          zIndex: 9005, // Bring above vignette
          alignItems: "flex-end",
        }}
        className="hide-on-mobile"
      >
        {PAGES.map((page, i) => {
          const isActive = i === activeIndex;
          const isHovered = i === hoveredIndex;
          return (
            <div
              key={page.path}
              style={{ display: "flex", alignItems: "center", gap: 12, cursor: "none", position: "relative" }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: isHovered ? "#ffffff" : "transparent",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  transition: "color 0.3s ease",
                  pointerEvents: "none",
                }}
              >
                {page.label}
              </div>
              
              <div 
                style={{ 
                  width: 8, 
                  height: 24, 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  position: "relative"
                }}
              >
                <button
                  onClick={() => navigate(page.path)}
                  tabIndex={-1}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: isHovered ? "#ffffff" : "#444444",
                    border: "none",
                    padding: 0,
                    transition: "all 0.3s ease",
                    cursor: "none",
                  }}
                />
                
                {/* Active animated pill */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavDot"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    style={{
                      position: "absolute",
                      width: 8,
                      height: 24,
                      borderRadius: 4,
                      background: "#ff4444",
                      boxShadow: "0 0 10px rgba(255,68,68,0.5)",
                      pointerEvents: "none",
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div
          style={{
            position: "fixed",
            bottom: 40,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#1a0000",
            border: "1px solid #ff4444",
            color: "#ff4444",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            padding: "12px 24px",
            zIndex: 9999,
            letterSpacing: 2,
            textTransform: "uppercase",
            boxShadow: "0 0 20px rgba(255, 68, 68, 0.3)",
          }}
        >
          {error}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .hide-on-mobile { display: none !important; }
        }
      `}</style>
    </>
  );
}

export default function PageSwitcher() {
  return (
    <Suspense fallback={null}>
      <PageSwitcherContent />
    </Suspense>
  );
}
