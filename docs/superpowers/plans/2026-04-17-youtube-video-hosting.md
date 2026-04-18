# YouTube Video Hosting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Supabase Storage video upload flow with unlisted YouTube embeds so that admins can paste a URL instead of uploading a file, eliminating the per-file size cap.

**Architecture:** `days.media_storage_path` is renamed to `days.media_youtube_id` and stores the 11-character YouTube video ID. The admin form takes a pasted URL, the server parses it to an ID via a small helper, and the reveal API returns the raw ID. The client renders a thumbnail with a play-button overlay that swaps to a `youtube-nocookie.com` iframe on tap. The upload API route and the browser-side Supabase client are deleted.

**Tech Stack:** Next.js 16 (App Router), TypeScript, React 19, Supabase (Postgres + Storage), Zod, Vitest, Tailwind 4.

**Spec:** `docs/superpowers/specs/2026-04-17-youtube-video-hosting-design.md`

---

## File Structure

**Create:**
- `supabase/migrations/0006_youtube_media.sql` — renames the column
- `src/lib/youtube.ts` — `parseYouTubeId(input)` helper
- `tests/unit/youtube.test.ts` — unit tests for the parser

**Modify:**
- `src/lib/supabase/types.ts` — rename column in generated TS types
- `src/schemas/day.ts` — add `media_youtube_url` to `DayPatch`
- `src/app/api/admin/days/[n]/route.ts` — parse URL, write ID
- `src/app/api/days/[n]/reveal/route.ts` — drop signed URL, return ID
- `src/app/admin/page.tsx` — update status column
- `src/components/admin/DayEditForm.tsx` — replace upload UI with URL field
- `src/components/reveal/MediaVideo.tsx` — click-to-play embed + exported `YouTubeEmbed`
- `src/components/reveal/Recap.tsx` — rename prop, use `YouTubeEmbed`
- `src/app/day/[n]/page.tsx` — rename payload field, thread the ID through

**Delete:**
- `src/app/api/admin/days/[n]/media/route.ts` — entire file; not used after this change

---

## Task 1: YouTube URL parser (unit-tested)

**Files:**
- Create: `src/lib/youtube.ts`
- Test: `tests/unit/youtube.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/youtube.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseYouTubeId } from "@/lib/youtube";

describe("parseYouTubeId", () => {
  it("parses https://www.youtube.com/watch?v=<id>", () => {
    expect(parseYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("parses https://youtu.be/<id>", () => {
    expect(parseYouTubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("parses https://www.youtube.com/embed/<id>", () => {
    expect(parseYouTubeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("parses https://m.youtube.com/watch?v=<id>", () => {
    expect(parseYouTubeId("https://m.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("accepts a bare 11-char id", () => {
    expect(parseYouTubeId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("ignores extra query parameters", () => {
    expect(parseYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s&feature=share")).toBe("dQw4w9WgXcQ");
  });
  it("returns null for non-youtube urls", () => {
    expect(parseYouTubeId("https://vimeo.com/123456")).toBeNull();
  });
  it("returns null for garbage", () => {
    expect(parseYouTubeId("not a url")).toBeNull();
  });
  it("returns null for empty string", () => {
    expect(parseYouTubeId("")).toBeNull();
  });
  it("trims whitespace", () => {
    expect(parseYouTubeId("  https://youtu.be/dQw4w9WgXcQ  ")).toBe("dQw4w9WgXcQ");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test tests/unit/youtube.test.ts`
Expected: FAIL — module `@/lib/youtube` does not exist.

- [ ] **Step 3: Implement the parser**

Create `src/lib/youtube.ts`:

```ts
const ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export function parseYouTubeId(input: string): string | null {
  const trimmed = input.trim();
  if (trimmed === "") return null;

  if (ID_PATTERN.test(trimmed)) return trimmed;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");

  if (host === "youtu.be") {
    const id = url.pathname.slice(1);
    return ID_PATTERN.test(id) ? id : null;
  }

  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") {
      const v = url.searchParams.get("v") ?? "";
      return ID_PATTERN.test(v) ? v : null;
    }
    if (url.pathname.startsWith("/embed/")) {
      const id = url.pathname.slice("/embed/".length);
      return ID_PATTERN.test(id) ? id : null;
    }
  }

  return null;
}

export function youtubeThumbnailUrl(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function youtubeEmbedUrl(id: string): string {
  const params = new URLSearchParams({
    autoplay: "1",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}
```

Note: `hqdefault.jpg` is used (not `maxresdefault.jpg`) because `maxresdefault` isn't generated for every video while `hqdefault` always exists. If higher-res thumbnails are desired later, the component can add an `onError` fallback.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test tests/unit/youtube.test.ts`
Expected: PASS — all 10 cases green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/youtube.ts tests/unit/youtube.test.ts
git commit -m "feat(lib): add YouTube URL parser and embed helpers"
```

---

## Task 2: Database migration

**Files:**
- Create: `supabase/migrations/0006_youtube_media.sql`

- [ ] **Step 1: Verify the next migration number**

Run: `ls supabase/migrations/`
Expected: migrations `0001_initial_schema.sql` through `0005_*.sql` exist. Confirm `0006` is unused.

If `0006` is taken, increment to the next free number and use that in the filename and commit message below.

- [ ] **Step 2: Write the migration**

Create `supabase/migrations/0006_youtube_media.sql`:

```sql
alter table days rename column media_storage_path to media_youtube_id;
```

- [ ] **Step 3: Apply the migration locally**

Run: `pnpm supabase db reset` (rebuilds the local DB from all migrations)

Or, if the user prefers incremental: `pnpm supabase db push`

Expected: migration applies without error. The `days` table now has a `media_youtube_id text` column and no `media_storage_path` column.

- [ ] **Step 4: Regenerate Supabase types**

Run: `pnpm db:types`
Expected: `src/lib/supabase/types.ts` is overwritten; `media_storage_path` is replaced with `media_youtube_id` in the `days` Row, Insert, and Update types.

If `pnpm db:types` isn't available in the environment (no running local DB), edit `src/lib/supabase/types.ts` manually. It currently contains three occurrences of `media_storage_path` (one per Row/Insert/Update) at approximately lines 134, 149, 164 — rename each to `media_youtube_id`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0006_youtube_media.sql src/lib/supabase/types.ts
git commit -m "feat(db): rename media_storage_path to media_youtube_id"
```

---

## Task 3: Zod schema for admin patch

**Files:**
- Modify: `src/schemas/day.ts`

- [ ] **Step 1: Add the new optional field**

In `src/schemas/day.ts`, add `media_youtube_url` to the `DayPatch` object schema. The field represents the raw URL the admin pasted (or `null`/`""` to clear); the route handler — not the schema — does the parsing. Updated `DayPatch`:

```ts
export const DayPatch = z.object({
  activity_type: z.enum(["riddle", "quiz", "creative", "kindness"]).optional(),
  activity_title: z.string().min(1).max(200).optional(),
  activity_body: z.string().min(1).max(5000).optional(),
  activity_answer: z.string().max(500).nullable().optional(),
  expected_minutes: z.number().int().min(1).max(120).optional(),
  media_type: z.enum(["video", "mystery_photos", "animated_postcard", "montage"]).optional(),
  coupon_text: z.string().min(1).max(300).optional(),
  points: z.number().int().min(0).max(100).optional(),
  media_config: z.record(z.string(), z.unknown()).optional(),
  media_youtube_url: z.string().max(200).nullable().optional(),
});
```

- [ ] **Step 2: Typecheck**

Run: `pnpm build` (or `pnpm exec tsc --noEmit` if preferred)

Expected: errors in `src/app/api/admin/days/[n]/route.ts` and/or `src/components/admin/DayEditForm.tsx` — the schema is now wider than those consumers expect. Those errors will be cleared by the next tasks. If `pnpm build` is too slow, skip this step.

- [ ] **Step 3: Commit**

```bash
git add src/schemas/day.ts
git commit -m "feat(schema): accept media_youtube_url in day patch"
```

---

## Task 4: Admin PUT route parses URL → ID

**Files:**
- Modify: `src/app/api/admin/days/[n]/route.ts`

- [ ] **Step 1: Rewrite the PUT handler**

Replace the full contents of `src/app/api/admin/days/[n]/route.ts` with:

```ts
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
  const patch: TablesUpdate<"days"> = { ...rest };

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
```

- [ ] **Step 2: Typecheck the route**

Run: `pnpm exec tsc --noEmit`
Expected: this file is clean. Other files may still have errors from Task 3; ignore them for now.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/days/[n]/route.ts
git commit -m "feat(api): admin PUT parses media_youtube_url to media_youtube_id"
```

---

## Task 5: Delete the upload API route

**Files:**
- Delete: `src/app/api/admin/days/[n]/media/route.ts`

- [ ] **Step 1: Delete the file**

Run: `rm src/app/api/admin/days/[n]/media/route.ts`

The containing directory `src/app/api/admin/days/[n]/media/` will be empty afterwards. Next.js won't care about an empty directory, but leaving it around is noise — remove it too:

Run: `rmdir src/app/api/admin/days/[n]/media`

- [ ] **Step 2: Verify nothing else imports it**

Run: `Grep` for `admin/days/.*/media` across `src/`.
Expected: the only remaining hits are in `src/components/admin/DayEditForm.tsx`. Those are fetch-call strings, not imports, and will be removed in Task 6.

- [ ] **Step 3: Commit**

```bash
git add -A src/app/api/admin/days/
git commit -m "refactor(api): remove obsolete media upload route"
```

---

## Task 6: Admin form takes a YouTube URL

**Files:**
- Modify: `src/components/admin/DayEditForm.tsx`

- [ ] **Step 1: Remove the upload-specific imports and supabase browser client**

At the top of `src/components/admin/DayEditForm.tsx`, delete these lines:

```ts
import { createClient } from "@supabase/supabase-js";

const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
```

- [ ] **Step 2: Update the `Day` type and state**

Change `media_storage_path: string | null` in the local `Day` type to `media_youtube_id: string | null`.

Replace the `const [mediaFile, setMediaFile] = useState<File | null>(null);` line with:

```tsx
const [youtubeUrl, setYoutubeUrl] = useState(
  day.media_youtube_id ? `https://youtu.be/${day.media_youtube_id}` : "",
);
```

- [ ] **Step 3: Replace the `save` function body**

Replace the current `async function save(e: React.FormEvent) { ... }` with:

```tsx
async function save(e: React.FormEvent) {
  e.preventDefault();
  setSaving(true);
  setStatus("Saving…");

  const includeYoutube = form.media_type === "video" || form.media_type === "montage";

  const patch: Record<string, unknown> = {
    activity_type: form.activity_type,
    activity_title: form.activity_title,
    activity_body: form.activity_body,
    activity_answer: form.activity_answer === "" ? null : form.activity_answer,
    expected_minutes: form.expected_minutes,
    media_type: form.media_type,
    coupon_text: form.coupon_text,
    points: form.points,
  };
  if (includeYoutube) {
    patch.media_youtube_url = youtubeUrl.trim();
  }

  const res = await fetch(`/api/admin/days/${day.day_number}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    setStatus(`Save failed: ${err.error ?? res.status}`);
    setSaving(false);
    return;
  }

  setStatus("Saved");
  setSaving(false);
  window.location.reload();
}
```

- [ ] **Step 4: Replace the `removeVideo` function**

Replace the current `async function removeVideo() { ... }` with:

```tsx
async function removeVideo() {
  if (!confirm("Remove the YouTube video for Day " + day.day_number + "?")) return;
  const res = await fetch(`/api/admin/days/${day.day_number}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ media_youtube_url: null }),
  });
  if (res.ok) window.location.reload();
  else alert("Remove failed");
}
```

- [ ] **Step 5: Replace the video file input block in the JSX**

Find the block that starts with `{(form.media_type === "video" || form.media_type === "montage") && (` and replace the entire `<div>...</div>` content with:

```tsx
{(form.media_type === "video" || form.media_type === "montage") && (
  <div className="border border-neutral-200 rounded p-3 bg-white grid gap-2">
    <h3 className="font-semibold text-sm">YouTube video</h3>
    <div className="flex items-center gap-2">
      <p className="text-xs text-neutral-500">
        Current: {day.media_youtube_id
          ? <a href={`https://youtu.be/${day.media_youtube_id}`} target="_blank" rel="noreferrer" className="underline">{day.media_youtube_id}</a>
          : <em>none set</em>}
      </p>
      {day.media_youtube_id && (
        <button type="button" onClick={removeVideo}
          className="px-2 py-0.5 rounded bg-red-600 text-white text-xs font-medium">
          Remove
        </button>
      )}
    </div>
    <input
      type="url"
      inputMode="url"
      placeholder="https://youtu.be/…  (unlisted is fine)"
      value={youtubeUrl}
      onChange={(e) => setYoutubeUrl(e.target.value)}
      className="w-full bg-white border border-neutral-300 rounded p-2 text-sm"
    />
    <p className="text-xs text-neutral-500">Accepts youtube.com/watch, youtu.be, or /embed URLs. Unlisted videos work.</p>
  </div>
)}
```

- [ ] **Step 6: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: `DayEditForm.tsx` is clean. Other files may still error — Tasks 7–9 will clear them.

- [ ] **Step 7: Commit**

```bash
git add src/components/admin/DayEditForm.tsx
git commit -m "feat(admin): paste YouTube URL instead of uploading video file"
```

---

## Task 7: Reveal API returns the ID

**Files:**
- Modify: `src/app/api/days/[n]/reveal/route.ts`

- [ ] **Step 1: Drop the signed-URL block and return the ID**

In `src/app/api/days/[n]/reveal/route.ts`:

Delete these lines (currently around lines 51–55):

```ts
let media_signed_url: string | null = null;
if ((day.media_type === "video" || day.media_type === "montage") && day.media_storage_path) {
  const { data } = await sb.storage.from("media").createSignedUrl(day.media_storage_path, SIGNED_URL_TTL);
  media_signed_url = data?.signedUrl ?? null;
}
```

In the `return NextResponse.json({...})` object, replace the line:

```ts
media_signed_url,
```

with:

```ts
media_youtube_id: day.media_youtube_id,
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: this file is clean.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/days/[n]/reveal/route.ts
git commit -m "feat(api): reveal returns media_youtube_id instead of signed url"
```

---

## Task 8: Admin home status column

**Files:**
- Modify: `src/app/admin/page.tsx`

- [ ] **Step 1: Update the media badge**

In `src/app/admin/page.tsx`, find this block (around lines 42–44):

```tsx
{d.media_storage_path
  ? <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-800">media ✓</span>
  : <span className="px-2 py-1 rounded bg-amber-100 text-amber-800">no media</span>}
```

Replace with:

```tsx
{d.media_youtube_id
  ? <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-800">video ✓</span>
  : <span className="px-2 py-1 rounded bg-amber-100 text-amber-800">no video</span>}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "feat(admin): show YouTube status in day list"
```

---

## Task 9: YouTube player component (click-to-play)

**Files:**
- Modify: `src/components/reveal/MediaVideo.tsx`

- [ ] **Step 1: Rewrite the component**

Replace the entire contents of `src/components/reveal/MediaVideo.tsx` with:

```tsx
"use client";
import { useState } from "react";
import { youtubeEmbedUrl, youtubeThumbnailUrl } from "@/lib/youtube";

export function YouTubeEmbed({
  youtubeId,
  className = "",
}: { youtubeId: string; className?: string }) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className={`aspect-video w-full rounded-2xl overflow-hidden border-[3px] border-ink shadow-[4px_4px_0_var(--color-ink)] bg-black ${className}`}>
        <iframe
          src={youtubeEmbedUrl(youtubeId)}
          title="Papa's video"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label="Play video"
      className={`relative aspect-video w-full rounded-2xl overflow-hidden border-[3px] border-ink shadow-[4px_4px_0_var(--color-ink)] bg-black ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={youtubeThumbnailUrl(youtubeId)}
        alt=""
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 grid place-items-center bg-black/20">
        <div className="w-16 h-16 rounded-full bg-red-600 border-[3px] border-ink shadow-[3px_3px_0_var(--color-ink)] grid place-items-center">
          <span className="block w-0 h-0 border-y-[12px] border-y-transparent border-l-[18px] border-l-white ml-1" />
        </div>
      </div>
    </button>
  );
}

export function MediaVideo({
  youtubeId, onContinue,
}: { youtubeId: string | null; onContinue: () => void }) {
  return (
    <div className="max-w-sm mx-auto p-4 grid gap-4 animate-fade-up">
      <h2 className="font-display text-3xl text-center text-accent">A message from Papa</h2>
      {youtubeId ? (
        <YouTubeEmbed youtubeId={youtubeId} />
      ) : (
        <div className="aspect-video rounded-2xl border-[3px] border-dashed border-ink bg-white grid place-items-center p-6 text-center font-body">
          Papa&apos;s surprise is coming soon 💌
        </div>
      )}
      <button
        onClick={onContinue}
        className="p-3 rounded-xl bg-accent text-white font-display text-2xl border-[3px] border-ink shadow-[3px_3px_0_var(--color-ink)] active:translate-y-[2px] active:shadow-[1px_1px_0_var(--color-ink)]"
      >
        Continue
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: this file is clean. Two consumers (`Recap.tsx`, `day/[n]/page.tsx`) will still error — next tasks fix them.

- [ ] **Step 3: Commit**

```bash
git add src/components/reveal/MediaVideo.tsx
git commit -m "feat(reveal): click-to-play YouTube embed component"
```

---

## Task 10: Recap uses the YouTube embed

**Files:**
- Modify: `src/components/reveal/Recap.tsx`

- [ ] **Step 1: Import `YouTubeEmbed`**

At the top of `src/components/reveal/Recap.tsx`, add the import next to the existing `PuzzleImage` import:

```tsx
import { YouTubeEmbed } from "@/components/reveal/MediaVideo";
```

- [ ] **Step 2: Rename the prop on the outer `Recap`**

In the prop-types block, change `mediaSignedUrl: string | null;` to `mediaYoutubeId: string | null;`.

In the destructured parameter list, change `mediaSignedUrl,` to `mediaYoutubeId,`.

At the call site inside `Recap` (the `<MediaPreview ... />` JSX), change `src={mediaSignedUrl}` to `youtubeId={mediaYoutubeId}`.

- [ ] **Step 3: Update `MediaPreview`**

In the inner `MediaPreview` function:

- Change the prop name in the types: `src: string | null;` → `youtubeId: string | null;`.
- Change the destructured parameter: `src,` → `youtubeId,`.
- Replace the entire `if (mediaType === "video" || mediaType === "montage") { ... }` block with:

```tsx
if (mediaType === "video" || mediaType === "montage") {
  if (!youtubeId) {
    return (
      <div className="aspect-video rounded-xl border-[3px] border-dashed border-ink bg-white grid place-items-center p-6 text-center font-body text-sm">
        Papa&apos;s surprise is coming soon 💌
      </div>
    );
  }
  return <YouTubeEmbed youtubeId={youtubeId} className="rounded-xl shadow-[3px_3px_0_var(--color-ink)]" />;
}
```

- [ ] **Step 4: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: `Recap.tsx` is clean. One consumer (`day/[n]/page.tsx`) still errors — fixed in Task 11.

- [ ] **Step 5: Commit**

```bash
git add src/components/reveal/Recap.tsx
git commit -m "feat(reveal): recap uses YouTube embed"
```

---

## Task 11: Wire through the day page

**Files:**
- Modify: `src/app/day/[n]/page.tsx`

- [ ] **Step 1: Update the local `RevealPayload` type**

In `src/app/day/[n]/page.tsx`, change the line:

```ts
media_signed_url: string | null;
```

to:

```ts
media_youtube_id: string | null;
```

- [ ] **Step 2: Update the `Recap` call**

Find the `<Recap ... />` JSX (around lines 117–133) and change:

```tsx
mediaSignedUrl={reveal.media_signed_url}
```

to:

```tsx
mediaYoutubeId={reveal.media_youtube_id}
```

- [ ] **Step 3: Update the `MediaVideo` call**

Find the `<MediaVideo ... />` JSX (around line 152) and change:

```tsx
<MediaVideo src={reveal.media_signed_url} onContinue={() => setStep("jigsaw")} />
```

to:

```tsx
<MediaVideo youtubeId={reveal.media_youtube_id} onContinue={() => setStep("jigsaw")} />
```

- [ ] **Step 4: Typecheck the whole project**

Run: `pnpm exec tsc --noEmit`
Expected: no errors anywhere.

- [ ] **Step 5: Run all unit tests**

Run: `pnpm test`
Expected: all tests (including the new YouTube parser tests) pass.

- [ ] **Step 6: Lint**

Run: `pnpm lint`
Expected: no errors. (One `eslint-disable-next-line @next/next/no-img-element` comment is expected — YouTube thumbnails aren't optimizable through Next's `Image` component without configuring remote hosts, and that's more ceremony than this one thumbnail warrants.)

- [ ] **Step 7: Commit**

```bash
git add src/app/day/[n]/page.tsx
git commit -m "feat(reveal): day page threads media_youtube_id through"
```

---

## Task 12: Manual verification

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Run: `pnpm dev`
Expected: server starts on `http://localhost:3000` with no console errors.

- [ ] **Step 2: Admin save path**

1. Navigate to `/admin`, sign in as admin.
2. Open any day with `media_type = video`.
3. Paste `https://www.youtube.com/watch?v=dQw4w9WgXcQ` into the YouTube URL field. Save.
4. Reload; confirm "Current: dQw4w9WgXcQ" (as a clickable link) renders.
5. On `/admin`, confirm the day now shows the green "video ✓" badge.
6. Click Remove; confirm the field clears and the badge flips to "no video".

- [ ] **Step 3: Invalid URL rejection**

1. Paste `https://vimeo.com/123` into the URL field. Save.
2. Expected: status message reads `Save failed: invalid youtube url`. The DB is unchanged.

- [ ] **Step 4: Kid reveal path**

1. Seed a day with a valid YouTube ID via the admin flow.
2. Sign in as kid, unlock the day (use the admin "Unlock now" button if needed), complete the activity.
3. On the media step, confirm the thumbnail image renders with a red play-button overlay.
4. Tap it; confirm the iframe mounts and the video starts playing with sound.
5. Tap Continue; complete the rest of the flow until the Recap page.
6. On the Recap, confirm the video section shows the same click-to-play thumbnail.

- [ ] **Step 5: Fallback rendering**

1. On a day with no YouTube ID set, go through the reveal.
2. Expected: the "Papa's surprise is coming soon 💌" dashed-border card renders on both the media step and the Recap.

- [ ] **Step 6: No commit**

This task produces no code changes — nothing to commit.

---

## Done

The implementation is complete when:

- All 12 tasks above have their checkboxes ticked.
- `pnpm test`, `pnpm exec tsc --noEmit`, and `pnpm lint` all pass.
- The manual verification in Task 12 completes without issues.
- `git log` shows 11 commits matching the commit messages in this plan (Task 12 adds no commit).
