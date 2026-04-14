"use client";
import { useState } from "react";

type Photo = {
  label: string;
  close_up_signed_url?: string;
  full_signed_url?: string;
};

export function MediaMystery({
  photos, correctIndex, funFact, onContinue,
}: { photos: Photo[]; correctIndex: number; funFact?: string; onContinue: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const revealed = selected === correctIndex;
  const noPhotos = photos.length === 0;

  if (noPhotos) {
    return (
      <div className="max-w-sm mx-auto p-4 grid gap-4 animate-fade-up">
        <h2 className="font-display text-3xl text-center text-accent">What is Daddy looking at?</h2>
        <div className="aspect-video rounded-2xl border-[3px] border-dashed border-ink bg-white grid place-items-center p-6 text-center font-body">
          Daddy&apos;s mystery photos are coming soon 💌
        </div>
        <button
          onClick={onContinue}
          className="p-3 rounded-xl bg-accent text-white font-display text-2xl border-[3px] border-ink shadow-[3px_3px_0_var(--color-ink)] active:translate-y-[2px] active:shadow-[1px_1px_0_var(--color-ink)]"
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto p-4 grid gap-4 animate-fade-up">
      <h2 className="font-display text-3xl text-center text-accent">What is Daddy looking at?</h2>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((p, i) => {
          const src = revealed && i === correctIndex ? p.full_signed_url : p.close_up_signed_url;
          const ringClass = selected === i
            ? (revealed ? "ring-4 ring-grass" : "ring-4 ring-accent")
            : "ring-[2px] ring-ink/40";
          return (
            <button
              key={i}
              onClick={() => setSelected(i)}
              disabled={revealed}
              className={`aspect-square rounded-xl overflow-hidden bg-white border-[2px] border-ink ${ringClass} active:translate-y-[1px] transition-transform`}
              aria-label={`Photo ${i + 1}`}
            >
              {src && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={p.label} className="w-full h-full object-cover" />
              )}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        revealed
          ? <div className="p-3 rounded-xl bg-grass/40 border-[2px] border-ink font-display text-xl text-center">🎉 Yes! {photos[correctIndex]?.label ?? ""}</div>
          : <div className="p-3 rounded-xl bg-sun/40 border-[2px] border-ink font-body text-sm text-center">Not quite — try another!</div>
      )}
      {revealed && funFact && (
        <div className="p-4 rounded-xl bg-white border-[3px] border-ink shadow-[3px_3px_0_var(--color-ink)] font-body text-sm leading-relaxed whitespace-pre-wrap">
          {funFact}
        </div>
      )}
      <button
        onClick={onContinue}
        disabled={!revealed}
        className="p-3 rounded-xl bg-accent text-white font-display text-2xl border-[3px] border-ink shadow-[3px_3px_0_var(--color-ink)] disabled:opacity-30 disabled:pointer-events-none active:translate-y-[2px] active:shadow-[1px_1px_0_var(--color-ink)]"
      >
        Continue
      </button>
    </div>
  );
}
