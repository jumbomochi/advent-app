"use client";
import { useState } from "react";
import { youtubeEmbedUrl, youtubeThumbnailUrl } from "@/lib/youtube";

export function YouTubeEmbed({
  youtubeId,
  className = "",
}: { youtubeId: string; className?: string }) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className={`aspect-video w-full rounded-2xl overflow-hidden border-[3px] border-ink shadow-[4px_4px_0_var(--color-ink)] bg-black ${className}`}>
        <iframe
          src={youtubeEmbedUrl(youtubeId)}
          title="Papa's video"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label="Play video"
      className={`relative aspect-video w-full rounded-2xl overflow-hidden border-[3px] border-ink shadow-[4px_4px_0_var(--color-ink)] bg-black ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={youtubeThumbnailUrl(youtubeId)}
        alt=""
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 grid place-items-center bg-black/20">
        <div className="w-16 h-16 rounded-full bg-red-600 border-[3px] border-ink shadow-[3px_3px_0_var(--color-ink)] grid place-items-center">
          <span className="block w-0 h-0 border-y-[12px] border-y-transparent border-l-[18px] border-l-white ml-1" />
        </div>
      </div>
    </button>
  );
}

export function MediaVideo({
  youtubeId, onContinue,
}: { youtubeId: string | null; onContinue: () => void }) {
  return (
    <div className="max-w-sm mx-auto p-4 grid gap-4 animate-fade-up">
      <h2 className="font-display text-3xl text-center text-accent">A message from Papa</h2>
      {youtubeId ? (
        <YouTubeEmbed youtubeId={youtubeId} />
      ) : (
        <div className="aspect-video rounded-2xl border-[3px] border-dashed border-ink bg-white grid place-items-center p-6 text-center font-body">
          Papa&apos;s surprise is coming soon 💌
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
