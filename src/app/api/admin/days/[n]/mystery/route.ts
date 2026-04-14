import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/guards/admin";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

type MediaConfig = {
  photos?: Array<{ close_up_path: string; full_path: string; label: string }>;
  correct_index?: number;
};

export async function POST(req: NextRequest, ctx: { params: Promise<{ n: string }> }) {
  const { denied } = await requireAdmin();
  if (denied) return denied;
  const n = Number((await ctx.params).n);
  const form = await req.formData();
  const closeUp = form.get("close_up");
  const full = form.get("full");
  const label = String(form.get("label") ?? "");
  const correct = form.get("correct") === "true";
  if (!(closeUp instanceof File) || !(full instanceof File)) {
    return NextResponse.json({ error: "need close_up + full" }, { status: 400 });
  }
  for (const f of [closeUp, full]) {
    if (!ALLOWED.includes(f.type)) return NextResponse.json({ error: "bad type" }, { status: 400 });
    if (f.size > MAX_BYTES) return NextResponse.json({ error: "too big" }, { status: 413 });
  }

  const sb = adminClient();
  const idx = Date.now();
  const cPath = `day-${n}-${idx}-close.jpg`;
  const fPath = `day-${n}-${idx}-full.jpg`;
  await sb.storage.from("mystery").upload(cPath, await closeUp.arrayBuffer(), { contentType: closeUp.type, upsert: true });
  await sb.storage.from("mystery").upload(fPath, await full.arrayBuffer(), { contentType: full.type, upsert: true });

  const { data: day } = await sb.from("days").select("media_config").eq("day_number", n).single();
  const cfg: MediaConfig = (day?.media_config as MediaConfig) ?? {};
  const photos = Array.isArray(cfg.photos) ? cfg.photos : [];
  photos.push({ close_up_path: cPath, full_path: fPath, label });
  if (correct) cfg.correct_index = photos.length - 1;
  cfg.photos = photos;
  await sb.from("days").update({ media_config: cfg }).eq("day_number", n);
  return NextResponse.json({ ok: true, photos });
}
