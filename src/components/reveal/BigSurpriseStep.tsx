"use client";
import { Confetti } from "./Confetti";

export function BigSurpriseStep({ onDone }: { onDone: () => void }) {
  return (
    <div className="relative max-w-sm mx-auto p-6 grid gap-4 text-center animate-fade-up">
      <Confetti count={30} />
      <div className="text-7xl animate-bounce">🎁</div>
      <h2 className="font-display text-4xl text-accent">Daddy&apos;s big surprise!</h2>
      <p className="font-body text-lg">Ask Mummy when Daddy comes home.</p>
      <button
        onClick={onDone}
        className="p-3 rounded-xl bg-accent text-white font-display text-2xl border-[3px] border-ink shadow-[3px_3px_0_var(--color-ink)] active:translate-y-[2px] active:shadow-[1px_1px_0_var(--color-ink)]"
      >
        Done
      </button>
    </div>
  );
}
