import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireKid } from "@/lib/guards/kid";
import { isUnlocked } from "@/lib/unlock";

const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest, ctx: { params: Promise<{ n: string }> }) {
  const unauthorized = await requireKid();
  if (unauthorized) return unauthorized;
  const n = Number((await ctx.params).n);

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "no file" }, { status: 400 });
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: "bad type" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "too big" }, { status: 413 });

  const sb = adminClient();
  const { data: day } = await sb.from("days").select("unlock_at,activity_type").eq("day_number", n).single();
  if (!day) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!isUnlocked({ day_number: n, unlock_at: day.unlock_at }, { isAdmin: false })) {
    return NextResponse.json({ error: "locked" }, { status: 403 });
  }
  if (day.activity_type !== "creative") return NextResponse.json({ error: "wrong type" }, { status: 400 });

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `day-${n}-${Date.now()}.${ext}`;
  const { error: uploadErr } = await sb.storage.from("photos")
    .upload(path, await file.arrayBuffer(), { contentType: file.type });
  if (uploadErr) return NextResponse.json({ error: "upload failed" }, { status: 500 });

  await sb.from("completions").upsert({ day_number: n, photo_storage_path: path });
  await sb.from("audit_log").insert({ actor: "kid", action: "completed_day", payload: { day: n, type: "creative" } });
  return NextResponse.json({ ok: true });
}
