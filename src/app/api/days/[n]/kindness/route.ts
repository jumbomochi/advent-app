import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireKid } from "@/lib/guards/kid";
import { isUnlocked } from "@/lib/unlock";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ n: string }> }) {
  const unauthorized = await requireKid();
  if (unauthorized) return unauthorized;
  const n = Number((await ctx.params).n);

  const sb = adminClient();
  const { data: day } = await sb.from("days").select("unlock_at,activity_type").eq("day_number", n).single();
  if (!day) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!isUnlocked({ day_number: n, unlock_at: day.unlock_at }, { isAdmin: false })) {
    return NextResponse.json({ error: "locked" }, { status: 403 });
  }
  if (day.activity_type !== "kindness") return NextResponse.json({ error: "wrong type" }, { status: 400 });

  await sb.from("completions").upsert({ day_number: n });
  await sb.from("audit_log").insert({ actor: "kid", action: "completed_day", payload: { day: n, type: "kindness" } });
  return NextResponse.json({ ok: true });
}
