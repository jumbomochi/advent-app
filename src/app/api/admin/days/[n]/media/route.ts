import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/guards/admin";

const MAX_BYTES = 200 * 1024 * 1024;
const ALLOWED = ["video/mp4", "video/webm", "video/quicktime"];

export async function POST(req: NextRequest, ctx: { params: Promise<{ n: string }> }) {
  const { denied } = await requireAdmin();
  if (denied) return denied;
  const n = Number((await ctx.params).n);
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "no file" }, { status: 400 });
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: "bad type" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "too big" }, { status: 413 });

  const ext = file.type === "video/mp4" ? "mp4" : file.type === "video/webm" ? "webm" : "mov";
  const path = `day-${n}.${ext}`;
  const sb = adminClient();
  const { error } = await sb.storage.from("media").upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await sb.from("days").update({ media_storage_path: path }).eq("day_number", n);
  return NextResponse.json({ ok: true, path });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ n: string }> }) {
  const { denied } = await requireAdmin();
  if (denied) return denied;
  const n = Number((await ctx.params).n);
  const sb = adminClient();

  const { data: day } = await sb.from("days").select("media_storage_path").eq("day_number", n).single();
  const current = day?.media_storage_path;
  if (current) {
    await sb.storage.from("media").remove([current]);
  }
  const { error } = await sb.from("days").update({ media_storage_path: null }).eq("day_number", n);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
