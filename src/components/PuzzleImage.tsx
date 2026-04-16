"use client";
import { useState } from "react";

export function PuzzleImage({ dayNumber }: { dayNumber: number }) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <div className="w-full rounded-xl border-[3px] border-ink bg-white shadow-[3px_3px_0_var(--color-ink)] p-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/puzzles/day-${dayNumber}.png`}
        alt={`Day ${dayNumber} puzzle`}
        onError={() => setHidden(true)}
        className="w-full rounded-lg"
      />
    </div>
  );
}
