import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminClient } from "@/lib/supabase/admin";
import { requireKid } from "@/lib/guards/kid";
import { isUnlocked } from "@/lib/unlock";
import { matches } from "@/lib/answer";

const Body = z.object({ answer: z.string().min(1).max(200) });

export async function POST(req: NextRequest, ctx: { params: Promise<{ n: string }> }) {
  const unauthorized = await requireKid();
  if (unauthorized) return unauthorized;
  const n = Number((await ctx.params).n);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad body" }, { status: 400 });

  const sb = adminClient();
  const { data: day } = await sb.from("days").select("*").eq("day_number", n).single();
  if (!day) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!isUnlocked({ day_number: n, unlock_at: day.unlock_at }, { isAdmin: false })) {
    return NextResponse.json({ error: "locked" }, { status: 403 });
  }
  if (!["riddle", "quiz"].includes(day.activity_type)) {
    return NextResponse.json({ error: "wrong activity type" }, { status: 400 });
  }

  const correct = matches(parsed.data.answer, day.activity_answer);
  if (!correct) return NextResponse.json({ correct: false });

  await sb.from("completions").upsert({ day_number: n });
  await sb.from("audit_log").insert({ actor: "kid", action: "completed_day", payload: { day: n, type: day.activity_type } });
  return NextResponse.json({ correct: true });
}
