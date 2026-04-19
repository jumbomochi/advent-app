import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/guards/admin";
import { DayPatch } from "@/schemas/day";
import type { Json, TablesUpdate } from "@/lib/supabase/types";
import { parseYouTubeId } from "@/lib/youtube";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ n: string }> }) {
  const { denied } = await requireAdmin();
  if (denied) return denied;
  const n = Number((await ctx.params).n);
  const parsed = DayPatch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad body", details: parsed.error.issues }, { status: 400 });

  const { media_youtube_url, ...rest } = parsed.data;
  const patch = { ...rest } as TablesUpdate<"days">;

  if (media_youtube_url !== undefined) {
    if (media_youtube_url === null || media_youtube_url === "") {
      patch.media_youtube_id = null;
    } else {
      const id = parseYouTubeId(media_youtube_url);
      if (!id) return NextResponse.json({ error: "invalid youtube url" }, { status: 400 });
      patch.media_youtube_id = id;
    }
  }

  const sb = adminClient();
  const { error } = await sb.from("days").update(patch).eq("day_number", n);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await sb.from("audit_log").insert({ actor: "admin", action: "admin_edit_day", payload: { day: n, patch: parsed.data } as unknown as Json });
  return NextResponse.json({ ok: true });
}
