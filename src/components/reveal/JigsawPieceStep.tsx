"use client";
import { useState } from "react";
import { JigsawPieceImage } from "@/components/JigsawPieceImage";
import { Confetti } from "./Confetti";

export function JigsawPieceStep({
  dayNumber, onPlaced,
}: { dayNumber: number; onPlaced: () => void }) {
  const [placed, setPlaced] = useState(false);
  const [busy, setBusy] = useState(false);

  async function place() {
    if (placed || busy) return;
    setBusy(true);
    const res = await fetch(`/api/days/${dayNumber}/kid-tile`, { method: "POST" });
    setBusy(false);
    if (res.ok) {
      setPlaced(true);
      setTimeout(onPlaced, 1400);
    }
  }

  return (
    <div className="relative max-w-sm mx-auto p-4 grid gap-4 animate-fade-up">
      {placed && <Confetti count={18} />}
      <h2 className="font-display text-3xl text-center text-accent">
        {placed ? "Piece placed! 🧩" : "Tap to add today's piece"}
      </h2>
      <button
        onClick={place}
        disabled={placed || busy}
        aria-label="Place piece"
        className={`mx-auto aspect-square w-[200px] max-w-[60vw] rounded-2xl overflow-hidden border-[3px] border-ink bg-white shadow-[4px_4px_0_var(--color-ink)] transition-transform ${placed ? "scale-90 opacity-60" : "hover:scale-[1.03] active:translate-y-[2px] active:shadow-[2px_2px_0_var(--color-ink)]"}`}
      >
        <JigsawPieceImage n={dayNumber} className="w-full h-full object-contain" />
      </button>
    </div>
  );
}
