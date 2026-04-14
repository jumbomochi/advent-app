import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireKid } from "@/lib/guards/kid";
import { isUnlocked } from "@/lib/unlock";
import { isFinalRewardUnlocked, totalPoints } from "@/lib/reveal";
import { TOTAL_DAYS } from "@/lib/constants";

const SIGNED_URL_TTL = 60 * 60;

type MysteryPhoto = {
  close_up_path: string;
  full_path: string;
  label: string;
  close_up_signed_url?: string;
  full_signed_url?: string;
};

type MediaConfig = {
  photos?: MysteryPhoto[];
  correct_index?: number;
  text?: string;
  emoji?: string;
  colors?: string[];
};

export async function GET(_req: NextRequest, ctx: { params: Promise<{ n: string }> }) {
  const unauthorized = await requireKid();
  if (unauthorized) return unauthorized;
  const n = Number((await ctx.params).n);

  const sb = adminClient();
  const { data: day } = await sb.from("days").select("*").eq("day_number", n).single();
  if (!day) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!isUnlocked({ day_number: n, unlock_at: day.unlock_at }, { isAdmin: false })) {
    return NextResponse.json({ error: "locked" }, { status: 403 });
  }

  const { data: completion } = await sb.from("completions").select("day_number").eq("day_number", n).maybeSingle();
  if (!completion) return NextResponse.json({ error: "not completed" }, { status: 403 });

  let media_signed_url: string | null = null;
  if ((day.media_type === "video" || day.media_type === "montage") && day.media_storage_path) {
    const { data } = await sb.storage.from("media").createSignedUrl(day.media_storage_path, SIGNED_URL_TTL);
    media_signed_url = data?.signedUrl ?? null;
  }

  const config: MediaConfig = (day.media_config as MediaConfig) ?? {};
  if (day.media_type === "mystery_photos" && Array.isArray(config.photos)) {
    for (const p of config.photos) {
      const cu = await sb.storage.from("mystery").createSignedUrl(p.close_up_path, SIGNED_URL_TTL);
      const full = await sb.storage.from("mystery").createSignedUrl(p.full_path, SIGNED_URL_TTL);
      p.close_up_signed_url = cu.data?.signedUrl ?? undefined;
      p.full_signed_url = full.data?.signedUrl ?? undefined;
    }
  }

  const { data: doneDays } = await sb.from("completions").select("day_number");
  const { data: tiledDays } = await sb.from("kid_tile_completions").select("day_number");
  const { data: allPoints } = await sb.from("days").select("day_number,points");
  const final_reward_unlocked = isFinalRewardUnlocked({
    dayNumber: n,
    completedDays: (doneDays ?? []).map((r) => r.day_number),
    tiledDays: (tiledDays ?? []).map((r) => r.day_number),
    days: allPoints ?? [],
  });

  return NextResponse.json({
    media_type: day.media_type,
    media_signed_url,
    media_config: config,
    coupon_text: day.coupon_text,
    points: day.points,
    total_points: totalPoints(allPoints ?? [], (doneDays ?? []).map((r) => r.day_number)),
    final_reward_unlocked,
    jigsaw_state: Array.from({ length: TOTAL_DAYS }, (_, i) =>
      (tiledDays ?? []).some((r) => r.day_number === i + 1),
    ),
  });
}
