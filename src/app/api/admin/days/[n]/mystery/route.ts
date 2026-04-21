import { NextRequest, NextResponse } from "next/server";
import convert from "heic-convert";
import { adminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/guards/admin";

const MAX_BYTES = 10 * 1024 * 1024;
const RASTER = ["image/jpeg", "image/png", "image/webp"];
const HEIC = ["image/heic", "image/heif"];

type MediaConfig = {
  photos?: Array<{ close_up_path: string; full_path: string; label: string }>;
  correct_index?: number;
};

type Prepared = { body: ArrayBuffer; contentType: string; ext: string };

function isHeic(file: File): boolean {
  if (HEIC.includes(file.type)) return true;
  const name = file.name.toLowerCase();
  return name.endsWith(".heic") || name.endsWith(".heif");
}

function isAcceptable(file: File): boolean {
  return RASTER.includes(file.type) || isHeic(file);
}

function extFor(contentType: string): string {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  return "jpg";
}

async function prepare(file: File): Promise<Prepared> {
  const raw = await file.arrayBuffer();
  if (isHeic(file)) {
    const jpeg = await convert({ buffer: raw, format: "JPEG", quality: 0.9 });
    return { body: jpeg, contentType: "image/jpeg", ext: "jpg" };
  }
  const contentType = file.type || "image/jpeg";
  return { body: raw, contentType, ext: extFor(contentType) };
}

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
    if (!isAcceptable(f)) {
      return NextResponse.json({ error: `bad type: ${f.type || "(unknown)"}` }, { status: 400 });
    }
    if (f.size > MAX_BYTES) return NextResponse.json({ error: "too big" }, { status: 413 });
  }

  let preparedClose: Prepared;
  let preparedFull: Prepared;
  try {
    [preparedClose, preparedFull] = await Promise.all([prepare(closeUp), prepare(full)]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: `decode failed: ${msg}` }, { status: 400 });
  }

  const sb = adminClient();
  const idx = Date.now();
  const cPath = `day-${n}-${idx}-close.${preparedClose.ext}`;
  const fPath = `day-${n}-${idx}-full.${preparedFull.ext}`;

  const cUp = await sb.storage.from("mystery").upload(cPath, preparedClose.body, {
    contentType: preparedClose.contentType,
    upsert: true,
  });
  if (cUp.error) return NextResponse.json({ error: `storage close-up: ${cUp.error.message}` }, { status: 500 });

  const fUp = await sb.storage.from("mystery").upload(fPath, preparedFull.body, {
    contentType: preparedFull.contentType,
    upsert: true,
  });
  if (fUp.error) return NextResponse.json({ error: `storage full: ${fUp.error.message}` }, { status: 500 });

  const { data: day } = await sb.from("days").select("media_config").eq("day_number", n).single();
  const cfg: MediaConfig = (day?.media_config as MediaConfig) ?? {};
  const photos = Array.isArray(cfg.photos) ? cfg.photos : [];
  photos.push({ close_up_path: cPath, full_path: fPath, label });
  if (correct) cfg.correct_index = photos.length - 1;
  cfg.photos = photos;
  await sb.from("days").update({ media_config: cfg }).eq("day_number", n);
  return NextResponse.json({ ok: true, photos });
}
