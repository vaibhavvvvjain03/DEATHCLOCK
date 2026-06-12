"use client";
import { useEffect, useRef } from "react";

interface RadarProps {
  size?: number;
  city?: string;
}

const BLIPS = [
  { angle: 35, r: 0.72 },
  { angle: 105, r: 0.45 },
  { angle: 168, r: 0.82 },
  { angle: 215, r: 0.38 },
  { angle: 290, r: 0.65 },
  { angle: 340, r: 0.55 },
];

export default function Radar({ size = 280, city }: RadarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef(0);
  const blipTimers = useRef<{ [key: number]: number }>({});
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cx = size / 2;
    const cy = size / 2;
    const radii = [size / 2 - 1, size * 0.73, size * 0.47, size * 0.2];
    const sweepSpeed = 0.025; // radians per frame
    const trailDeg = 60 * (Math.PI / 180);

    const draw = () => {
      ctx.clearRect(0, 0, size, size);

      // Background
      ctx.fillStyle = "#050505";
      ctx.beginPath();
      ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
      ctx.fill();

      // Concentric rings
      radii.forEach((r) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = "#ff444422";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Cross lines
      ctx.strokeStyle = "#1a0a0a";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, 2);
      ctx.lineTo(cx, size - 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(2, cy);
      ctx.lineTo(size - 2, cy);
      ctx.stroke();

      // Sweep fan (trailing gradient arc)
      const currentAngle = angleRef.current;
      const startAngle = currentAngle - trailDeg;

      const gradient = ctx.createConicalGradient
        ? null // fallback below
        : null;

      // Draw sweep using arc fill slices
      const steps = 24;
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const a1 = startAngle + t * trailDeg;
        const a2 = startAngle + (t + 1) * trailDeg;
        const alpha = t * 0.18;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, size / 2 - 1, a1, a2);
        ctx.closePath();
        ctx.fillStyle = `rgba(255, 68, 68, ${alpha})`;
        ctx.fill();
      }

      // Leading edge bright line
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(
        cx + (size / 2 - 1) * Math.cos(currentAngle),
        cy + (size / 2 - 1) * Math.sin(currentAngle)
      );
      ctx.strokeStyle = "rgba(255, 68, 68, 0.5)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Blips
      BLIPS.forEach((blip, idx) => {
        const blipAngle = (blip.angle * Math.PI) / 180;
        const bx = cx + blip.r * (size / 2) * Math.cos(blipAngle);
        const by = cy + blip.r * (size / 2) * Math.sin(blipAngle);

        // Check if sweep is passing this blip
        const normalizedBlip =
          ((blipAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const normalizedSweep =
          ((currentAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const diff =
          ((normalizedSweep - normalizedBlip + Math.PI * 2) % (Math.PI * 2));

        if (diff < sweepSpeed * 2) {
          blipTimers.current[idx] = Date.now();
        }

        const blipAge = blipTimers.current[idx]
          ? (Date.now() - blipTimers.current[idx]) / 400
          : 1;

        if (blipAge < 1) {
          const alpha = 1 - blipAge;
          // Core dot
          ctx.beginPath();
          ctx.arc(bx, by, 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 68, 68, ${alpha})`;
          ctx.fill();

          // Expanding ring
          ctx.beginPath();
          ctx.arc(bx, by, 3 + blipAge * 10, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 68, 68, ${alpha * 0.4})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          // Dormant blip — very faint
          ctx.beginPath();
          ctx.arc(bx, by, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 68, 68, 0.08)";
          ctx.fill();
        }
      });

      // Center dot
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#ff4444";
      ctx.shadowColor = "#ff4444";
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Clip to circle
      // (already drawn inside arc)

      angleRef.current += sweepSpeed;
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [size]);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{
          borderRadius: "50%",
          display: "block",
          border: "1px solid #1a0505",
        }}
      />
    </div>
  );
}
