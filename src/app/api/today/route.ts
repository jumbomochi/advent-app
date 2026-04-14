import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireKid } from "@/lib/guards/kid";
import { isUnlocked } from "@/lib/unlock";
import { DAY_DATES, TOTAL_DAYS } from "@/lib/constants";

function todaysDayNumber(now: Date): number {
  const sgt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
  const exact = DAY_DATES.find((d) => d.date === sgt);
  if (exact) return exact.n;
  const past = DAY_DATES.filter((d) => d.date < sgt);
  if (past.length === 0) return 1;
  if (past.length === TOTAL_DAYS) return TOTAL_DAYS;
  const last = past[past.length - 1];
  return last ? last.n + 1 : 1;
}

export async function GET(_req: NextRequest) {
  const unauthorized = await requireKid();
  if (unauthorized) return unauthorized;

  const now = new Date();
  const n = todaysDayNumber(now);
  const sb = adminClient();
  const { data: day } = await sb.from("days").select("*").eq("day_number", n).single();
  if (!day) return NextResponse.json({ error: "missing day" }, { status: 500 });

  const unlocked = isUnlocked(
    { day_number: day.day_number, unlock_at: day.unlock_at },
    { isAdmin: false },
    now,
  );

  const { data: completion } = await sb.from("completions").select("day_number").eq("day_number", n).maybeSingle();
  const { data: tile } = await sb.from("kid_tile_completions").select("day_number").eq("day_number", n).maybeSingle();
  const { data: allTiles } = await sb.from("kid_tile_completions").select("day_number");
  const jigsaw_state = Array.from({ length: TOTAL_DAYS }, (_, i) =>
    (allTiles ?? []).some((r) => r.day_number === i + 1),
  );
  const { data: doneDays } = await sb.from("completions").select("day_number");
  const { data: pointsRows } = await sb.from("days").select("day_number,points");
  const total_points = (pointsRows ?? [])
    .filter((r) => (doneDays ?? []).some((d) => d.day_number === r.day_number))
    .reduce((s, r) => s + r.points, 0);

  return NextResponse.json({
    day_number: day.day_number,
    date: day.date,
    unlock_at: day.unlock_at,
    unlocked,
    activity_type: unlocked ? day.activity_type : null,
    activity_title: unlocked ? day.activity_title : null,
    activity_body: unlocked ? day.activity_body : null,
    expected_minutes: day.expected_minutes,
    media_type: unlocked ? day.media_type : null,
    completed: !!completion,
    kid_tile_completed: !!tile,
    total_points,
    jigsaw_state,
  });
}
