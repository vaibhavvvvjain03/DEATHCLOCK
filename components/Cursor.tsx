"use client";
import { useEffect, useRef, useState } from "react";

export default function Cursor() {
  const crosshairRef = useRef<HTMLDivElement>(null);

  const [hover, setHover] = useState(false);
  const [clicking, setClicking] = useState(false);

  useEffect(() => {
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
    };
  }, []);

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
      >
        <line x1="2" y1="10" x2="6" y2="10" stroke={strokeColor} strokeWidth="1.5" />
        <line x1="14" y1="10" x2="18" y2="10" stroke={strokeColor} strokeWidth="1.5" />
        <line x1="10" y1="2" x2="10" y2="6" stroke={strokeColor} strokeWidth="1.5" />
        <line x1="10" y1="14" x2="10" y2="18" stroke={strokeColor} strokeWidth="1.5" />
      </svg>
    </div>
  );
}
