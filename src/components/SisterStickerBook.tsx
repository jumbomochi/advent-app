"use client";

const STICKERS = ["🦋", "🦁", "🐘", "🦒", "🐢", "🦊", "🐶", "🐱", "🐰"];

export function SisterStickerBook({ placed }: { placed: boolean[] }) {
  const collected = placed.filter(Boolean).length;
  return (
    <section className="max-w-md sm:max-w-2xl md:max-w-4xl mx-auto px-4 mt-6">
      <div className="flex items-center justify-center gap-2 mb-2">
        <h2 className="font-display text-2xl text-accent">Lil&apos; Explorer</h2>
        <span className="px-2 py-0.5 rounded-full border-[2px] border-ink bg-orchid/50 font-display text-sm shadow-[2px_2px_0_var(--color-ink)]">
          {collected}/9
        </span>
      </div>
      <div className="rounded-2xl border-[3px] border-ink bg-white p-2 sm:p-3 shadow-[5px_5px_0_var(--color-ink)]">
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-9 sm:gap-2">
          {STICKERS.map((emoji, i) => (
            <div
              key={i}
              className="aspect-square rounded-md bg-[color-mix(in_srgb,var(--color-paper)_80%,var(--color-ink)_5%)] border-[2px] border-dashed border-ink/40 flex items-center justify-center text-3xl sm:text-4xl"
            >
              {placed[i] ? (
                <span className="animate-piece-drop">{emoji}</span>
              ) : (
                <span className="opacity-20 font-display text-xl">?</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
