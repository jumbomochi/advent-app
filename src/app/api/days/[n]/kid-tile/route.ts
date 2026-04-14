import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireKid } from "@/lib/guards/kid";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ n: string }> }) {
  const unauthorized = await requireKid();
  if (unauthorized) return unauthorized;
  const n = Number((await ctx.params).n);

  const sb = adminClient();
  const { data: completion } = await sb.from("completions").select("day_number").eq("day_number", n).maybeSingle();
  if (!completion) return NextResponse.json({ error: "main activity not completed" }, { status: 400 });

  await sb.from("kid_tile_completions").upsert({ day_number: n });
  await sb.from("audit_log").insert({ actor: "kid", action: "placed_piece", payload: { day: n } });
  return NextResponse.json({ ok: true });
}
