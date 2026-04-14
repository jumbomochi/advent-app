"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { RiddleQuiz } from "@/components/activity/RiddleQuiz";
import { Creative } from "@/components/activity/Creative";
import { Kindness } from "@/components/activity/Kindness";
import { MediaVideo } from "@/components/reveal/MediaVideo";
import { MediaMystery } from "@/components/reveal/MediaMystery";
import { MediaPostcard } from "@/components/reveal/MediaPostcard";
import { JigsawPieceStep } from "@/components/reveal/JigsawPieceStep";
import { CouponStep } from "@/components/reveal/CouponStep";
import { BigSurpriseStep } from "@/components/reveal/BigSurpriseStep";

type ActivityType = "riddle" | "quiz" | "creative" | "kindness";
type MediaType = "video" | "mystery_photos" | "animated_postcard" | "montage";

type DayPayload = {
  day_number: number;
  activity_type: ActivityType;
  activity_title: string;
  activity_body: string;
  media_type: MediaType;
  completed: boolean;
  kid_tile_completed: boolean;
};

type Photo = { label: string; close_up_signed_url?: string; full_signed_url?: string };

type RevealPayload = {
  media_type: MediaType;
  media_signed_url: string | null;
  media_config: {
    photos?: Photo[];
    correct_index?: number;
    text?: string;
    emoji?: string;
    colors?: string[];
  };
  coupon_text: string;
  points: number;
  final_reward_unlocked: boolean;
};

type Step = "loading" | "activity" | "media" | "jigsaw" | "coupon" | "big_surprise" | "done";

export default function DayPage() {
  const params = useParams<{ n: string }>();
  const n = Number(params.n);
  const router = useRouter();
  const [day, setDay] = useState<DayPayload | null>(null);
  const [reveal, setReveal] = useState<RevealPayload | null>(null);
  const [step, setStep] = useState<Step>("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await fetch(`/api/days/${n}`);
      if (r.status === 403) {
        router.push("/");
        return;
      }
      if (!r.ok) {
        router.push("/");
        return;
      }
      const d = (await r.json()) as DayPayload;
      if (cancelled) return;
      setDay(d);
      if (d.completed) {
        const rv = await fetch(`/api/days/${n}/reveal`).then((x) => x.json()) as RevealPayload;
        if (cancelled) return;
        setReveal(rv);
        // If already completed + piece placed, resume from coupon. Otherwise from media.
        setStep(d.kid_tile_completed ? "coupon" : "media");
      } else {
        setStep("activity");
      }
    })();
    return () => { cancelled = true; };
  }, [n, router]);

  async function loadReveal() {
    const rv = await fetch(`/api/days/${n}/reveal`).then((x) => x.json()) as RevealPayload;
    setReveal(rv);
    setStep("media");
  }

  function afterCoupon() {
    if (reveal?.final_reward_unlocked && n === 9) setStep("big_surprise");
    else setStep("done");
  }

  return (
    <main className="min-h-screen p-4">
      <header className="max-w-sm mx-auto flex items-center gap-3">
        <button
          onClick={() => router.push("/")}
          className="px-3 py-1 rounded-lg border-[2px] border-ink bg-white font-display text-lg shadow-[2px_2px_0_var(--color-ink)] active:translate-y-[1px] active:shadow-[1px_1px_0_var(--color-ink)]"
        >
          ← Home
        </button>
        <h1 className="font-display text-3xl text-accent">Day {n}</h1>
      </header>

      {step === "loading" && (
        <p className="text-center mt-10 font-body opacity-60">Loading…</p>
      )}

      {step === "activity" && day && (
        <>
          {(day.activity_type === "riddle" || day.activity_type === "quiz") && (
            <RiddleQuiz dayNumber={n} title={day.activity_title} body={day.activity_body} onSolved={loadReveal} />
          )}
          {day.activity_type === "creative" && (
            <Creative dayNumber={n} title={day.activity_title} body={day.activity_body} onDone={loadReveal} />
          )}
          {day.activity_type === "kindness" && (
            <Kindness dayNumber={n} title={day.activity_title} body={day.activity_body} onDone={loadReveal} />
          )}
        </>
      )}

      {step === "media" && reveal && (
        <>
          {(reveal.media_type === "video" || reveal.media_type === "montage") && (
            <MediaVideo src={reveal.media_signed_url} onContinue={() => setStep("jigsaw")} />
          )}
          {reveal.media_type === "mystery_photos" && (
            <MediaMystery
              photos={reveal.media_config.photos ?? []}
              correctIndex={reveal.media_config.correct_index ?? 0}
              onContinue={() => setStep("jigsaw")}
            />
          )}
          {reveal.media_type === "animated_postcard" && (
            <MediaPostcard config={reveal.media_config} onContinue={() => setStep("jigsaw")} />
          )}
        </>
      )}

      {step === "jigsaw" && reveal && (
        <JigsawPieceStep dayNumber={n} onPlaced={() => setStep("coupon")} />
      )}

      {step === "coupon" && reveal && (
        <CouponStep
          coupon={reveal.coupon_text}
          points={reveal.points}
          showContinue={n === 9 && reveal.final_reward_unlocked}
          onContinue={afterCoupon}
        />
      )}

      {step === "big_surprise" && (
        <BigSurpriseStep onDone={() => router.push("/")} />
      )}

      {step === "done" && (
        <div className="max-w-sm mx-auto mt-10 text-center grid gap-3 animate-fade-up">
          <h2 className="font-display text-4xl text-accent">See you tomorrow! 👋</h2>
          <button
            onClick={() => router.push("/")}
            className="mx-auto p-3 px-6 rounded-xl bg-accent text-white font-display text-2xl border-[3px] border-ink shadow-[3px_3px_0_var(--color-ink)] active:translate-y-[2px] active:shadow-[1px_1px_0_var(--color-ink)]"
          >
            Home
          </button>
        </div>
      )}
    </main>
  );
}
