"use client";
import { useMemo } from "react";

const COLORS = ["var(--color-accent)", "var(--color-sun)", "var(--color-sky)", "var(--color-grass)", "var(--color-orchid)"];

export function Confetti({ count = 14 }: { count?: number }) {
  const particles = useMemo(
    () => Array.from({ length: count }, (_, i) => {
      const tx = (Math.random() * 160 - 80).toFixed(0);
      const delay = (Math.random() * 200).toFixed(0);
      const color = COLORS[i % COLORS.length] ?? "var(--color-accent)";
      const size = 6 + Math.random() * 6;
      const left = 10 + Math.random() * 80;
      return { tx, delay, color, size, left, key: i };
    }),
    [count],
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.key}
          className="absolute top-0 rounded-sm animate-confetti"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            ["--tx" as string]: `${p.tx}px`,
            animationDelay: `${p.delay}ms`,
          }}
        />
      ))}
    </div>
  );
}
