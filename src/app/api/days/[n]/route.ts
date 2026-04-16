import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireKid } from "@/lib/guards/kid";
import { isUnlocked } from "@/lib/unlock";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ n: string }> }) {
  const unauthorized = await requireKid();
  if (unauthorized) return unauthorized;
  const n = Number((await ctx.params).n);
  if (!Number.isInteger(n) || n < 1 || n > 9) {
    return NextResponse.json({ error: "bad day" }, { status: 400 });
  }

  const sb = adminClient();
  const { data: day } = await sb.from("days").select("*").eq("day_number", n).single();
  if (!day) return NextResponse.json({ error: "not found" }, { status: 404 });

  const unlocked = isUnlocked(
    { day_number: day.day_number, unlock_at: day.unlock_at },
    { isAdmin: false },
  );
  if (!unlocked) return NextResponse.json({ error: "locked" }, { status: 403 });

  const { data: completion } = await sb.from("completions").select("day_number,completed_at").eq("day_number", n).maybeSingle();
  const { data: tile } = await sb.from("kid_tile_completions").select("day_number").eq("day_number", n).maybeSingle();
  const { data: sticker } = await sb.from("sticker_completions").select("day_number").eq("day_number", n).maybeSingle();

  return NextResponse.json({
    day_number: day.day_number,
    date: day.date,
    activity_type: day.activity_type,
    activity_title: day.activity_title,
    activity_body: day.activity_body,
    media_type: day.media_type,
    completed: !!completion,
    kid_tile_completed: !!tile,
    sticker_collected: !!sticker,
  });
}
