import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/guards/admin";

const MAX_BYTES = 25 * 1024 * 1024;

function extOf(name: string): string {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return (m?.[1] ?? "bin").slice(0, 8);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ n: string }> }) {
  const { denied } = await requireAdmin();
  if (denied) return denied;
  const n = Number((await ctx.params).n);
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "bad body" }, { status: 400 });
  }
  const { close_up, full } = body as {
    close_up?: { name?: string; size?: number };
    full?: { name?: string; size?: number };
  };
  if (!close_up?.name || !full?.name) {
    return NextResponse.json({ error: "missing close_up or full" }, { status: 400 });
  }
  if ((close_up.size ?? 0) > MAX_BYTES || (full.size ?? 0) > MAX_BYTES) {
    return NextResponse.json({ error: "file too large" }, { status: 413 });
  }

  const sb = adminClient();
  const idx = Date.now();
  const cPath = `day-${n}-${idx}-close.${extOf(close_up.name)}`;
  const fPath = `day-${n}-${idx}-full.${extOf(full.name)}`;

  const cSigned = await sb.storage.from("mystery").createSignedUploadUrl(cPath);
  if (cSigned.error) return NextResponse.json({ error: `sign close-up: ${cSigned.error.message}` }, { status: 500 });
  const fSigned = await sb.storage.from("mystery").createSignedUploadUrl(fPath);
  if (fSigned.error) return NextResponse.json({ error: `sign full: ${fSigned.error.message}` }, { status: 500 });

  return NextResponse.json({
    close_up: { path: cPath, signedUrl: cSigned.data.signedUrl, token: cSigned.data.token },
    full: { path: fPath, signedUrl: fSigned.data.signedUrl, token: fSigned.data.token },
  });
}
