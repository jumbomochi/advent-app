"use client";

export function MediaVideo({
  src, onContinue,
}: { src: string | null; onContinue: () => void }) {
  return (
    <div className="max-w-sm mx-auto p-4 grid gap-4 animate-fade-up">
      <h2 className="font-display text-3xl text-center text-accent">A message from Daddy</h2>
      {src ? (
        <video
          src={src}
          controls
          autoPlay
          playsInline
          className="w-full rounded-2xl bg-black border-[3px] border-ink shadow-[4px_4px_0_var(--color-ink)]"
        />
      ) : (
        <div className="aspect-video rounded-2xl border-[3px] border-dashed border-ink bg-white grid place-items-center p-6 text-center font-body">
          Daddy&apos;s surprise is coming soon 💌
        </div>
      )}
      <button
        onClick={onContinue}
        className="p-3 rounded-xl bg-accent text-white font-display text-2xl border-[3px] border-ink shadow-[3px_3px_0_var(--color-ink)] active:translate-y-[2px] active:shadow-[1px_1px_0_var(--color-ink)]"
      >
        Continue
      </button>
    </div>
  );
}
