"use client";

type PostcardConfig = { text?: string; emoji?: string; colors?: string[] };

export function MediaPostcard({
  config, onContinue,
}: { config: PostcardConfig; onContinue: () => void }) {
  const colors = config.colors ?? ["#facc15", "#f97316"];
  const c1 = colors[0] ?? "#facc15";
  const c2 = colors[1] ?? "#f97316";

  return (
    <div className="max-w-sm mx-auto p-4 grid gap-4 animate-fade-up">
      <h2 className="font-display text-3xl text-center text-accent">A postcard from Papa</h2>
      <div
        className="aspect-[4/3] rounded-2xl p-6 flex flex-col justify-between border-[3px] border-ink shadow-[5px_5px_0_var(--color-ink)] text-white"
        style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
      >
        <div className="text-6xl animate-bounce drop-shadow">{config.emoji ?? "📮"}</div>
        <div className="font-display text-3xl whitespace-pre-wrap leading-tight">{config.text ?? "A silly souvenir from Dad!"}</div>
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
