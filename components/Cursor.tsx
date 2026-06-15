/**
 * CURSOR
 * Replaces the browser cursor with an animated red crosshair that tracks
 * mouse movement. Expands on hover over interactive elements and shows a
 * coordinate read-out tooltip while moving.
 *
 * Accessibility:
 *   - Returns null (showing the native cursor) when:
 *     a) prefers-reduced-motion is set — motion is unwanted.
 *     b) The device is a touch device (no pointer to track).
 *   - When active, adds .custom-cursor-active to <body> so the CSS
 *     cursor:none rule applies. Removed on unmount.
 */
"use client";
import { useEffect, useRef, useState } from "react";

export default function Cursor() {
  const crosshairRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const [clicking, setClicking] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    // Do not render the custom cursor if:
    // 1. User prefers reduced motion — respect their OS-level setting
    // 2. Device is touch-based — no mouse pointer to track
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

    if (prefersReducedMotion || isTouch) {
      // Ensure body class is NOT set
      document.body.classList.remove("custom-cursor-active");
      return;
    }

    // Activate custom cursor: hide native cursor via body class
    document.body.classList.add("custom-cursor-active");
    setActive(true);

    const onMove = (e: MouseEvent) => {
      if (crosshairRef.current) {
        crosshairRef.current.style.transform = `translate(${e.clientX - 10}px, ${e.clientY - 10}px)`;
      }
    };

    const onMouseOver = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      setHover(!!el.closest("button, a, input, [role='button'], select, textarea"));
    };

    const onMouseDown = () => setClicking(true);
    const onMouseUp = () => setClicking(false);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onMouseOver);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onMouseOver);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      // Restore native cursor when component unmounts
      document.body.classList.remove("custom-cursor-active");
    };
  }, []);

  // Don't render the SVG crosshair until we've confirmed it should be active
  if (!active) return null;

  const strokeColor = clicking ? "#ffffff" : hover ? "#ff6666" : "#ff4444";

  return (
    <div
      ref={crosshairRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: 20,
        height: 20,
        pointerEvents: "none",
        zIndex: 99999,
        willChange: "transform",
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <line x1="2" y1="10" x2="6" y2="10" stroke={strokeColor} strokeWidth="1.5" />
        <line x1="14" y1="10" x2="18" y2="10" stroke={strokeColor} strokeWidth="1.5" />
        <line x1="10" y1="2" x2="10" y2="6" stroke={strokeColor} strokeWidth="1.5" />
        <line x1="10" y1="14" x2="10" y2="18" stroke={strokeColor} strokeWidth="1.5" />
      </svg>
    </div>
  );
}
