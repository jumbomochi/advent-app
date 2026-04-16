import Image from "next/image";
import { headers } from "next/headers";
import { DoorGrid, type Door } from "@/components/DoorGrid";
import { TripMapJigsaw } from "@/components/TripMapJigsaw";
import { CountdownTimer } from "@/components/CountdownTimer";
import { LogoutButton } from "@/components/LogoutButton";
import { CouponInventory } from "@/components/CouponInventory";
import { SisterStickerBook } from "@/components/SisterStickerBook";
import { adminClient } from "@/lib/supabase/admin";
import { TOTAL_DAYS } from "@/lib/constants";
import { currentBadge, nextBadge } from "@/lib/badges";

export const dynamic = "force-dynamic";

export default async function Home() {
  await headers(); // force dynamic rendering

  const sb = adminClient();
  const [{ data: days }, { data: completions }, { data: tiles }, { data: stickers }] = await Promise.all([
    sb.from("days").select("day_number,date,unlock_at,points").order("day_number"),
    sb.from("completions").select("day_number"),
    sb.from("kid_tile_completions").select("day_number"),
    sb.from("sticker_completions").select("day_number"),
  ]);

  const doneSet = new Set((completions ?? []).map((r) => r.day_number));
  const totalPoints = (days ?? [])
    .filter((d) => doneSet.has(d.day_number))
    .reduce((s, d) => s + d.points, 0);

  const now = Date.now();
  const nextUnlocked = (days ?? []).find((d) => new Date(d.unlock_at).getTime() > now);
  const todayNumber = nextUnlocked?.day_number ?? TOTAL_DAYS;

  const doors: Door[] = (days ?? []).map((d) => ({
    day_number: d.day_number,
    date: d.date,
    unlock_at: d.unlock_at,
    completed: doneSet.has(d.day_number),
  }));

  const jigsawState = Array.from({ length: TOTAL_DAYS }, (_, i) =>
    (tiles ?? []).some((r) => r.day_number === i + 1),
  );
  const stickerState = Array.from({ length: TOTAL_DAYS }, (_, i) =>
    (stickers ?? []).some((r) => r.day_number === i + 1),
  );

  const completedCount = doneSet.size;
  const badge = currentBadge(totalPoints, completedCount);
  const next = nextBadge(totalPoints, completedCount);
  const pointsToNext = next ? Math.max(0, next.threshold - totalPoints) : 0;

  return (
    <main className="min-h-screen p-4 pb-10">
      <header className="flex items-center max-w-md mx-auto gap-2">
        <Image src="/brand/logo.png" alt="" width={36} height={36} priority className="shrink-0" />
        <h1 className="font-display text-2xl sm:text-3xl text-accent flex-1 min-w-0 truncate">Where&apos;s Papa?</h1>
        <span className="px-2 py-1 rounded-full border-[2px] border-ink bg-sun font-display text-base shadow-[2px_2px_0_var(--color-ink)] shrink-0">
          ⭐{totalPoints}
        </span>
        <LogoutButton />
      </header>

      {(badge || next) && (
        <div className="max-w-md mx-auto mt-3 flex items-center justify-center gap-2 flex-wrap">
          {badge && (
            <span className="px-3 py-1 rounded-full border-[2px] border-ink bg-orchid font-display text-sm shadow-[2px_2px_0_var(--color-ink)]">
              {badge.emoji} {badge.label}
            </span>
          )}
          {next && pointsToNext > 0 && (
            <span className="font-body text-xs opacity-70">
              {pointsToNext} ⭐ to {next.label} {next.emoji}
            </span>
          )}
        </div>
      )}

      <DoorGrid doors={doors} todayNumber={todayNumber} />

      {nextUnlocked && (
        <p className="text-center my-3 font-body">
          Next door opens in <CountdownTimer target={nextUnlocked.unlock_at} />
        </p>
      )}

      <section className="mt-4">
        <h2 className="font-display text-2xl text-center mb-2 text-accent">Papa&apos;s Journey</h2>
        <TripMapJigsaw state={jigsawState} />
      </section>

      <SisterStickerBook placed={stickerState} />

      <CouponInventory />
    </main>
  );
}
