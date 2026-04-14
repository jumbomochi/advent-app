"use client";

type ActivityType = "riddle" | "quiz" | "creative" | "kindness";

export function Recap({
  dayNumber,
  activityType,
  title,
  body,
  correctAnswer,
  photoUrl,
  onContinue,
}: {
  dayNumber: number;
  activityType: ActivityType;
  title: string;
  body: string;
  correctAnswer: string | null;
  photoUrl: string | null;
  onContinue: () => void;
}) {
  return (
    <div className="max-w-sm mx-auto p-4 grid gap-4 animate-fade-up">
      <div className="inline-flex self-center px-3 py-1 rounded-full bg-grass/40 border-[2px] border-ink font-display text-sm">
        ✓ Day {dayNumber} — done!
      </div>
      <h2 className="font-display text-3xl text-center text-accent">{title}</h2>
      <p className="font-body text-base whitespace-pre-wrap leading-relaxed">{body}</p>

      {(activityType === "riddle" || activityType === "quiz") && correctAnswer && (
        <div className="p-3 rounded-xl bg-white border-[3px] border-ink shadow-[3px_3px_0_var(--color-ink)]">
          <div className="text-xs font-body uppercase tracking-wide opacity-60 mb-1">Your answer</div>
          <div className="font-display text-2xl text-accent">{correctAnswer}</div>
        </div>
      )}

      {activityType === "creative" && (
        <div className="p-2 rounded-xl bg-white border-[3px] border-ink shadow-[3px_3px_0_var(--color-ink)]">
          <div className="text-xs font-body uppercase tracking-wide opacity-60 mb-1 px-1">Your drawing</div>
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="Your upload" className="w-full rounded-lg" />
          ) : (
            <div className="font-body text-sm opacity-60 p-2">Photo not available</div>
          )}
        </div>
      )}

      {activityType === "kindness" && (
        <div className="p-3 rounded-xl bg-grass/30 border-[3px] border-ink shadow-[3px_3px_0_var(--color-ink)] font-display text-xl text-center">
          💚 You did it!
        </div>
      )}

      <button
        onClick={onContinue}
        className="p-3 rounded-xl bg-accent text-white font-display text-2xl border-[3px] border-ink shadow-[3px_3px_0_var(--color-ink)] active:translate-y-[2px] active:shadow-[1px_1px_0_var(--color-ink)]"
      >
        See reward
      </button>
    </div>
  );
}
