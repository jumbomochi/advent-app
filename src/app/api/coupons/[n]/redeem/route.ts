import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireKid } from "@/lib/guards/kid";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ n: string }> }) {
  const unauthorized = await requireKid();
  if (unauthorized) return unauthorized;
  const n = Number((await ctx.params).n);
  if (!Number.isInteger(n) || n < 1 || n > 9) {
    return NextResponse.json({ error: "bad day" }, { status: 400 });
  }

  const sb = adminClient();
  const { data: completion } = await sb
    .from("completions")
    .select("day_number,coupon_redeemed_at")
    .eq("day_number", n)
    .maybeSingle();

  if (!completion) {
    return NextResponse.json({ error: "not completed" }, { status: 400 });
  }
  if (completion.coupon_redeemed_at) {
    return NextResponse.json({ error: "already redeemed" }, { status: 409 });
  }

  await sb.from("completions").update({ coupon_redeemed_at: new Date().toISOString() }).eq("day_number", n);
  await sb.from("audit_log").insert({ actor: "kid", action: "redeemed_coupon", payload: { day: n } });
  return NextResponse.json({ ok: true });
}
