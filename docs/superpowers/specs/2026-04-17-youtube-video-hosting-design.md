# YouTube video hosting design

**Date:** 2026-04-17
**Status:** Approved, ready for implementation plan

## Problem

Daily reveal videos are uploaded to Supabase Storage via signed URL. The bucket has a 50MB per-file limit (Supabase default), which is too small for longer "message from Papa" videos. Raising the bucket limit works but still consumes storage + bandwidth on the Supabase project.

## Decision

Replace the file-upload flow entirely with unlisted YouTube videos. Admin pastes a URL; the app stores the 11-character video ID; the reveal page renders a click-to-play YouTube embed.

No coexistence with the old upload flow — the upload path is removed.

## Architecture

### Data flow

```
Admin pastes URL
  → PUT /api/admin/days/[n]  (media_youtube_id in body)
  → server parses ID, validates, writes days.media_youtube_id

Kid reveals day
  → GET /api/days/[n]/reveal
  → response includes { media_youtube_id: string | null }
  → <MediaVideo youtubeId={...}/> renders thumbnail + iframe-on-tap
```

### Schema

Migration `supabase/migrations/0006_youtube_media.sql`:

```sql
alter table days rename column media_storage_path to media_youtube_id;
```

- The column stores the 11-char video ID (e.g. `dQw4w9WgXcQ`), not a URL.
- Storing the ID keeps the column self-documenting and the render path trivial (no re-parsing).
- Existing rows will have storage paths like `day-1.mp4` in this column after the rename — those will be cleared during content re-entry. No data migration needed; the content is being rebuilt.
- The `media` storage bucket stays (still used by `mystery` and `photos`). Old video blobs in it are abandoned; leaving them is fine — they're inaccessible without a signed URL.

### URL parser

New helper `src/lib/youtube.ts`:

```ts
export function parseYouTubeId(input: string): string | null
```

Accepts:
- `https://www.youtube.com/watch?v=<id>` (any host, any query order)
- `https://youtu.be/<id>`
- `https://www.youtube.com/embed/<id>`
- `https://m.youtube.com/watch?v=<id>`
- Bare 11-character ID (`[A-Za-z0-9_-]{11}`)

Returns the 11-char ID or `null` for anything else. Caller returns HTTP 400 on `null`.

### Admin UX

`src/components/admin/DayEditForm.tsx`:

- When `media_type` is `video` or `montage`, replace the file-upload block with a single text input labeled "YouTube URL (unlisted is fine)".
- Current state shows either the saved video ID as a clickable `https://youtu.be/<id>` link + a Remove button, or "none set".
- On save: the URL string is included in the existing `PUT /api/admin/days/[n]` body as `media_youtube_id`. No separate media subroute round-trips.
- Empty string clears the value (equivalent to the old Remove).
- Remove button sends `{ media_youtube_id: null }` via the same PUT and reloads.

Drop:
- `import { createClient } from "@supabase/supabase-js"` and the `supabaseBrowser` instance — no longer used on the client.
- The `mediaFile` / `setMediaFile` state and the entire upload block.

`src/app/admin/page.tsx`:

- Update the per-day status column: show video ID (or "none") instead of storage path presence.

### API changes

**Remove entirely:** `src/app/api/admin/days/[n]/media/route.ts`

Its POST (sign upload), PATCH (confirm path), and DELETE (clear path) are all replaced by the simpler `PUT /api/admin/days/[n]` flow.

**Update `PUT /api/admin/days/[n]` + `src/schemas/day.ts`:**

- Add to `DayPatch` Zod schema:
  ```ts
  media_youtube_url: z.string().max(200).nullable().optional(),
  ```
  The client sends the raw pasted URL (or empty string / null).
- In the route handler, after `DayPatch.safeParse`:
  - If `media_youtube_url` is omitted → leave column untouched.
  - If `media_youtube_url` is `null` or `""` → set `media_youtube_id` to `null`.
  - If `media_youtube_url` is a non-empty string → run `parseYouTubeId`. On success, set `media_youtube_id` to the parsed ID. On failure, return 400 with `{ error: "invalid youtube url" }`.
- The `media_youtube_url` field is transformed (not stored); only `media_youtube_id` is written to the DB. Strip `media_youtube_url` from the patch before passing to Supabase.

**Update `GET /api/days/[n]/reveal` (`src/app/api/days/[n]/reveal/route.ts`):**

- Delete the `media_signed_url` block that calls `createSignedUrl` on the `media` bucket.
- Add `media_youtube_id: day.media_youtube_id` to the response payload.

**Update reveal payload type (`src/lib/reveal.ts`):**

- Replace `media_signed_url: string | null` with `media_youtube_id: string | null`.

**Update Supabase types (`src/lib/supabase/types.ts`):**

- Rename `media_storage_path` → `media_youtube_id` in the `days` Row / Insert / Update types.

### Player component

`src/components/reveal/MediaVideo.tsx` becomes a click-to-play embed:

```tsx
export function MediaVideo({
  youtubeId, onContinue,
}: { youtubeId: string | null; onContinue: () => void }) {
  const [playing, setPlaying] = useState(false);
  // ... render thumbnail + play button, swap to iframe on click
}
```

- Thumbnail: `https://i.ytimg.com/vi/<id>/maxresdefault.jpg` (falls back automatically to `hqdefault.jpg` via an `onError` if max-res isn't available).
- Play-button overlay: red rounded rectangle with triangle, centered, matches app's crayon-border aesthetic.
- On click: replaces thumbnail with `<iframe>`:
  ```
  https://www.youtube-nocookie.com/embed/<id>?autoplay=1&rel=0&modestbranding=1&playsinline=1
  ```
- Wrapper keeps `aspect-video`, `border-[3px] border-ink`, `shadow-[4px_4px_0_var(--color-ink)]`.
- When `youtubeId` is `null`: keep the existing "Papa's surprise is coming soon 💌" fallback card.
- `Continue` button stays below the video area, unchanged.

`src/app/day/[n]/page.tsx`:

- Update the local `RevealPayload` type: `media_signed_url` → `media_youtube_id`.
- Pass `youtubeId={reveal.media_youtube_id}` to `MediaVideo` instead of `src={reveal.media_signed_url}`.
- Update the `Recap` prop name (see next).

`src/components/reveal/Recap.tsx`:

- The inner `MediaPreview` also renders the video (with `<video src=...>`) for the recap view. Update its `video`/`montage` branch to render the same click-to-play YouTube embed as `MediaVideo`.
- Rename the prop `mediaSignedUrl: string | null` → `mediaYoutubeId: string | null` throughout `Recap` and `MediaPreview`.
- Extract the YouTube embed rendering into a shared subcomponent (inside `MediaVideo.tsx`) exported as `YouTubeEmbed` so both `MediaVideo` and `Recap`'s `MediaPreview` can use it. Keeps behavior identical between the first-watch view and the recap view.

### Cleanup

- Delete `src/app/api/admin/days/[n]/media/route.ts`.
- Delete the upload-specific state and functions in `DayEditForm`: `mediaFile`, `setMediaFile`, the upload block inside `save()`, and `removeVideo()`.
- `@supabase/supabase-js` stays in `package.json` — still used by server code (`src/lib/supabase/admin.ts`, `src/lib/supabase/server.ts`). Only the browser-side import in `DayEditForm` goes away.

## Testing

**Unit (Vitest):**

- `src/lib/youtube.test.ts` — 5 cases: each of the 4 accepted URL formats plus a rejection case ("not-a-url").

**Manual verification:**

The project has no E2E test suite yet (only `tests/unit/`). Verify by running `pnpm dev`, signing in as admin, saving a YouTube URL on a day, then signing in as the kid and walking through the reveal flow. Confirm the thumbnail renders, a tap mounts the iframe, the video plays, and the Recap page shows the same embed after completion.

## Out of scope

- Bulk-updating existing videos. The project is early enough that content is being rebuilt; no backfill migration.
- Supporting private (not unlisted) YouTube videos — embed wouldn't work.
- Supporting non-YouTube video URLs (Vimeo, etc.) — keep the surface narrow.
- Deleting the `media` storage bucket — still used by other media types.

## Risks and mitigations

- **Unlisted ≠ private.** Anyone with the URL can watch. This matches the existing trust model (kids share the same household device) and is acceptable.
- **YouTube branding visible.** `modestbranding=1` and `rel=0` reduce it but don't eliminate it. Acceptable trade-off for zero-cost unlimited hosting.
- **Kid needs network for the video.** Same as before — the previous flow also streamed from Supabase CDN.
- **Thumbnail availability.** `maxresdefault.jpg` isn't generated for every video. `onError` fallback to `hqdefault.jpg` covers this.
