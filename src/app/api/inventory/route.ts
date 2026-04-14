import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireKid } from "@/lib/guards/kid";

export async function GET() {
  const unauthorized = await requireKid();
  if (unauthorized) return unauthorized;

  const sb = adminClient();
  const [{ data: days }, { data: completions }] = await Promise.all([
    sb.from("days").select("day_number,coupon_text,points").order("day_number"),
    sb.from("completions").select("day_number,completed_at,coupon_redeemed_at"),
  ]);

  const doneByDay = new Map<number, { completed_at: string; coupon_redeemed_at: string | null }>();
  (completions ?? []).forEach((c) => {
    doneByDay.set(c.day_number, {
      completed_at: c.completed_at,
      coupon_redeemed_at: c.coupon_redeemed_at,
    });
  });

  const coupons = (days ?? [])
    .filter((d) => doneByDay.has(d.day_number))
    .map((d) => {
      const entry = doneByDay.get(d.day_number)!;
      return {
        day_number: d.day_number,
        coupon_text: d.coupon_text,
        points: d.points,
        earned_at: entry.completed_at,
        redeemed_at: entry.coupon_redeemed_at,
      };
    });

  return NextResponse.json({ coupons });
}
