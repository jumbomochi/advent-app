import { NextRequest, NextResponse } from "next/server";
import convert from "heic-convert";
import { adminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/guards/admin";

type MediaConfig = {
  photos?: Array<{ close_up_path: string; full_path: string; label: string }>;
  correct_index?: number;
};

type SbAdmin = ReturnType<typeof adminClient>;

async function maybeConvertHeic(sb: SbAdmin, path: string): Promise<{ path: string; error?: string }> {
  const lower = path.toLowerCase();
  if (!lower.endsWith(".heic") && !lower.endsWith(".heif")) return { path };

  const dl = await sb.storage.from("mystery").download(path);
  if (dl.error || !dl.data) return { path, error: dl.error?.message ?? "download failed" };

  const arr = await dl.data.arrayBuffer();
  let jpeg: ArrayBuffer;
  try {
    jpeg = await convert({ buffer: arr, format: "JPEG", quality: 0.9 });
  } catch (e) {
    return { path, error: e instanceof Error ? e.message : "decode failed" };
  }

  const jpegPath = path.replace(/\.[a-z0-9]+$/i, ".jpg");
  const up = await sb.storage.from("mystery").upload(jpegPath, jpeg, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (up.error) return { path, error: up.error.message };

  await sb.storage.from("mystery").remove([path]);
  return { path: jpegPath };
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ n: string }> }) {
  const { denied } = await requireAdmin();
  if (denied) return denied;
  const n = Number((await ctx.params).n);
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "bad body" }, { status: 400 });

  const { close_up_path, full_path, label, correct } = body as {
    close_up_path?: string;
    full_path?: string;
    label?: string;
    correct?: boolean;
  };
  if (!close_up_path || !full_path || !label) {
    return NextResponse.json({ error: "missing close_up_path/full_path/label" }, { status: 400 });
  }

  const sb = adminClient();

  const finalClose = await maybeConvertHeic(sb, close_up_path);
  if (finalClose.error) return NextResponse.json({ error: `convert close-up: ${finalClose.error}` }, { status: 500 });
  const finalFull = await maybeConvertHeic(sb, full_path);
  if (finalFull.error) return NextResponse.json({ error: `convert full: ${finalFull.error}` }, { status: 500 });

  const { data: day } = await sb.from("days").select("media_config").eq("day_number", n).single();
  const cfg: MediaConfig = (day?.media_config as MediaConfig) ?? {};
  const photos = Array.isArray(cfg.photos) ? cfg.photos : [];
  photos.push({ close_up_path: finalClose.path, full_path: finalFull.path, label });
  if (correct) cfg.correct_index = photos.length - 1;
  cfg.photos = photos;
  await sb.from("days").update({ media_config: cfg }).eq("day_number", n);

  return NextResponse.json({ ok: true, photos });
}
