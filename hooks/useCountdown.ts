import { useState, useEffect } from "react";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/**
 * Manages a real-time countdown from a given number
 * of seconds remaining, ticking down every second.
 * Returns formatted time units and percent remaining.
 */
export function useCountdown(initialSeconds: number) {
  const [ticks, setTicks] = useState(initialSeconds);

  useEffect(() => {
    setTicks(initialSeconds);
  }, [initialSeconds]);

  const isActive = ticks > 0;

  useEffect(() => {
    if (!isActive) return;
    const t = setInterval(() => setTicks((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [isActive]);

  const yrs = Math.floor(ticks / (365.25 * 24 * 3600));
  const rem = ticks - yrs * Math.floor(365.25 * 24 * 3600);
  const days = Math.floor(rem / (24 * 3600));
  const rem2 = rem - days * 24 * 3600;
  const hours = Math.floor(rem2 / 3600);
  const minutes = Math.floor((rem2 % 3600) / 60);
  const seconds = rem2 % 60;
  const percentRemaining = initialSeconds > 0 ? (ticks / initialSeconds) * 100 : 0;

  return {
    yrs,
    days,
    hh: pad(hours),
    mm: pad(minutes),
    ss: pad(seconds),
    hours,
    minutes,
    seconds,
    percentRemaining,
  };
}
