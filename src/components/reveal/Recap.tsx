"use client";
import { useState } from "react";
import { PuzzleImage } from "@/components/PuzzleImage";

type ActivityType = "riddle" | "quiz" | "creative" | "kindness";
type MediaType = "video" | "mystery_photos" | "animated_postcard" | "montage";

type MysteryPhoto = {
  label: string;
  close_up_signed_url?: string;
  full_signed_url?: string;
};

type MediaConfig = {
  photos?: MysteryPhoto[];
  correct_index?: number;
  fun_fact?: string;
  text?: string;
  emoji?: string;
  colors?: string[];
};

export function Recap({
  dayNumber,
  activityType,
  title,
  body,
  correctAnswer,
  photoUrl,
  mediaType,
  mediaSignedUrl,
  mediaConfig,
  couponText,
  points,
  kidTileCompleted,
  onContinue,
}: {
  dayNumber: number;
  activityType: ActivityType;
  title: string;
  body: string;
  correctAnswer: string | null;
  photoUrl: string | null;
  mediaType: MediaType;
  mediaSignedUrl: string | null;
  mediaConfig: MediaConfig;
  couponText: string;
  points: number;
  kidTileCompleted: boolean;
  onContinue: () => void;
}) {
  return (
    <div className="max-w-sm mx-auto p-4 grid gap-4 animate-fade-up pb-10">
      <div className="inline-flex self-center px-3 py-1 rounded-full bg-grass/40 border-[2px] border-ink font-display text-sm">
        ✓ Day {dayNumber} — done!
      </div>
      <h2 className="font-display text-3xl text-center text-accent">{title}</h2>
      <p className="font-body text-base whitespace-pre-wrap leading-relaxed">{body}</p>
      <PuzzleImage dayNumber={dayNumber} />

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

      <div className="pt-2">
        <div className="text-xs font-body uppercase tracking-wide opacity-60 mb-2 text-center">
          Papa&apos;s message
        </div>
        <MediaPreview mediaType={mediaType} src={mediaSignedUrl} config={mediaConfig} />
      </div>

      <div className="p-4 rounded-2xl bg-sun text-ink border-[3px] border-ink shadow-[4px_4px_0_var(--color-ink)] text-center">
        <div className="font-display text-xl text-accent">🎟️ Coupon</div>
        <div className="font-body text-base mt-1 whitespace-pre-wrap">{couponText}</div>
        <div className="font-display text-2xl text-accent mt-2">+{points} ⭐</div>
      </div>

      {!kidTileCompleted && (
        <button
          onClick={onContinue}
          className="p-3 rounded-xl bg-accent text-white font-display text-2xl border-[3px] border-ink shadow-[3px_3px_0_var(--color-ink)] active:translate-y-[2px] active:shadow-[1px_1px_0_var(--color-ink)]"
        >
          Place today&apos;s jigsaw piece 🧩
        </button>
      )}
    </div>
  );
}

function MediaPreview({
  mediaType,
  src,
  config,
}: {
  mediaType: MediaType;
  src: string | null;
  config: MediaConfig;
}) {
  if (mediaType === "video" || mediaType === "montage") {
    if (!src) {
      return (
        <div className="aspect-video rounded-xl border-[3px] border-dashed border-ink bg-white grid place-items-center p-6 text-center font-body text-sm">
          Papa&apos;s surprise is coming soon 💌
        </div>
      );
    }
    return (
      <video
        src={src}
        controls
        playsInline
        className="w-full rounded-xl bg-black border-[3px] border-ink shadow-[3px_3px_0_var(--color-ink)]"
      />
    );
  }

  if (mediaType === "animated_postcard") {
    const colors = config.colors ?? ["#facc15", "#f97316"];
    const c1 = colors[0] ?? "#facc15";
    const c2 = colors[1] ?? "#f97316";
    return (
      <div
        className="aspect-[4/3] rounded-2xl p-5 flex flex-col justify-between border-[3px] border-ink shadow-[4px_4px_0_var(--color-ink)] text-white"
        style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
      >
        <div className="text-5xl">{config.emoji ?? "📮"}</div>
        <div className="font-display text-2xl whitespace-pre-wrap leading-tight">{config.text ?? ""}</div>
      </div>
    );
  }

  if (mediaType === "mystery_photos") {
    const photos = config.photos ?? [];
    const correctIndex = config.correct_index ?? 0;
    if (photos.length === 0) {
      return (
        <div className="aspect-video rounded-xl border-[3px] border-dashed border-ink bg-white grid place-items-center p-6 text-center font-body text-sm">
          Papa&apos;s mystery photos are coming soon 💌
        </div>
      );
    }
    return (
      <div className="grid gap-3">
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p, i) => (
            <div
              key={i}
              className={`aspect-square rounded-xl overflow-hidden bg-white border-[2px] border-ink ${i === correctIndex ? "ring-4 ring-grass" : "opacity-70"}`}
            >
              {p.full_signed_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.full_signed_url} alt={p.label} className="w-full h-full object-cover" />
              )}
            </div>
          ))}
        </div>
        {photos[correctIndex] && (
          <div className="p-2 rounded-xl bg-grass/30 border-[2px] border-ink font-display text-lg text-center">
            {photos[correctIndex].label}
          </div>
        )}
        {config.fun_fact && <FunFact text={config.fun_fact} />}
      </div>
    );
  }

  return null;
}

function FunFact({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="p-3 rounded-xl bg-white border-[3px] border-ink shadow-[3px_3px_0_var(--color-ink)]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 font-display text-base text-accent"
      >
        <span>🤓 Fun fact</span>
        <span className="font-body text-sm opacity-60">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="mt-2 font-body text-sm whitespace-pre-wrap leading-relaxed">{text}</div>}
    </div>
  );
}
