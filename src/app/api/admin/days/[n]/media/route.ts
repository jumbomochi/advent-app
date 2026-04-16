import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/guards/admin";

const ALLOWED = ["video/mp4", "video/webm", "video/quicktime"];
const EXT: Record<string, string> = { "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov" };

export async function POST(req: NextRequest, ctx: { params: Promise<{ n: string }> }) {
  const { denied } = await requireAdmin();
  if (denied) return denied;
  const n = Number((await ctx.params).n);
  const { contentType } = await req.json().catch(() => ({}));
  if (!contentType || !ALLOWED.includes(contentType)) {
    return NextResponse.json({ error: "bad type" }, { status: 400 });
  }
  const path = `day-${n}.${EXT[contentType]}`;
  const sb = adminClient();
  const { data, error } = await sb.storage.from("media").createSignedUploadUrl(path);
  if (error || !data) return NextResponse.json({ error: error?.message ?? "sign failed" }, { status: 500 });
  return NextResponse.json({ signedUrl: data.signedUrl, token: data.token, path });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ n: string }> }) {
  const { denied } = await requireAdmin();
  if (denied) return denied;
  const n = Number((await ctx.params).n);
  const { path } = await req.json().catch(() => ({}));
  if (typeof path !== "string" || !path.startsWith(`day-${n}.`)) {
    return NextResponse.json({ error: "bad path" }, { status: 400 });
  }
  const sb = adminClient();
  const { error } = await sb.from("days").update({ media_storage_path: path }).eq("day_number", n);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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
