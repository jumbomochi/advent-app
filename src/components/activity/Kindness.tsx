"use client";
import { useState } from "react";

export function Kindness({
  dayNumber, title, body, onDone,
}: { dayNumber: number; title: string; body: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false);

  async function mark() {
    setBusy(true);
    const res = await fetch(`/api/days/${dayNumber}/kindness`, { method: "POST" });
    setBusy(false);
    if (res.ok) onDone();
  }

  return (
    <div className="max-w-sm mx-auto p-4 grid gap-4 animate-fade-up">
      <h2 className="font-display text-4xl text-accent text-center">{title}</h2>
      <p className="font-body text-lg whitespace-pre-wrap leading-relaxed">{body}</p>
      <button
        onClick={mark}
        disabled={busy}
        className="p-4 rounded-2xl bg-grass text-ink font-display text-2xl border-[3px] border-ink shadow-[4px_4px_0_var(--color-ink)] active:translate-y-[2px] active:shadow-[1px_1px_0_var(--color-ink)] disabled:opacity-40"
      >
        {busy ? "Saving…" : "We did it! ✨"}
      </button>
    </div>
  );
}
