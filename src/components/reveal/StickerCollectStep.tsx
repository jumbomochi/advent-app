"use client";
import { useState } from "react";
import { Confetti } from "./Confetti";

const STICKERS = ["🦋", "🦁", "🐘", "🦒", "🐢", "🦊", "🐶", "🐱", "🐰"];

export function StickerCollectStep({
  dayNumber,
  onCollected,
}: {
  dayNumber: number;
  onCollected: () => void;
}) {
  const [collected, setCollected] = useState(false);
  const [busy, setBusy] = useState(false);
  const emoji = STICKERS[dayNumber - 1] ?? "⭐";

  async function collect() {
    if (collected || busy) return;
    setBusy(true);
    const res = await fetch(`/api/days/${dayNumber}/sticker`, { method: "POST" });
    setBusy(false);
    if (res.ok) {
      setCollected(true);
      setTimeout(onCollected, 1400);
    }
  }

  return (
    <div className="relative max-w-sm mx-auto p-4 grid gap-4 animate-fade-up">
      {collected && <Confetti count={18} />}
      <h2 className="font-display text-3xl text-center text-accent">
        {collected ? "Got it! 🎉" : "Little sis — tap your sticker!"}
      </h2>
      <button
        onClick={collect}
        disabled={collected || busy}
        aria-label="Collect sticker"
        className={`mx-auto aspect-square w-[200px] max-w-[60vw] rounded-2xl border-[3px] border-ink bg-white shadow-[4px_4px_0_var(--color-ink)] text-7xl flex items-center justify-center transition-transform ${collected ? "scale-90 opacity-60" : "hover:scale-[1.03] active:translate-y-[2px] active:shadow-[2px_2px_0_var(--color-ink)]"}`}
      >
        {emoji}
      </button>
    </div>
  );
}
