# Daddy's Advent — Design Spec

**Date:** 2026-04-14
**Ship-by:** 2026-04-16 (day before departure)
**Live dates:** 2026-04-17 → 2026-04-25 (9 days)

## Purpose

A web app that gives my two kids (10yo and 4yo) one "door" per day for the 9 days I'm away on an overseas trip (Singapore → San Francisco → Las Vegas → San Francisco → Singapore). Each day unlocks at 3pm Singapore time, presents an age-appropriate activity, and upon completion reveals a video message from me, a treat coupon, and points toward a final reward.

## Trip context

- Fri 17 Apr 2026, 09:00 SGT — depart SIN → SFO
- Sun 19 Apr 2026 evening (PDT) — SFO → LAS
- Mon 20 Apr 2026 — Google ATP Day (Las Vegas)
- Wed–Fri 22–24 Apr 2026 — Google Next (Las Vegas)
- Fri 24 Apr 2026 evening (PDT) — LAS → SFO
- Sat 25 Apr 2026, 11:00 PDT — SFO → SIN (arriving 26 Apr SGT, but app finishes 25 Apr SGT while en route)

## Users & roles

- **Kid view** (shared by 10yo and 4yo) — gated by a household PIN. Sees only today's door + previously-completed days (read-only replay). Cannot peek ahead.
- **Admin view** (me + wife) — gated by Supabase magic-link email auth. Full calendar, can edit any day, upload/replace videos, peek ahead, override unlock, reset completion.

## Core mechanic

- 9 doors arranged in a 3×3 grid, numbered 1–9, each bound to a date.
- Each door is `locked` until `unlock_at = YYYY-04-DD 15:00 Asia/Singapore`.
- On unlock, the door becomes tappable. Tapping enters the day's activity screen.
- The 10yo drives the main activity (`riddle` | `creative` | `quiz` | `kindness`).
- After the main activity is completed, a **reveal sequence** plays:
  1. Short travel clip (10–30 sec) or special media from Dad
  2. **4yo's moment**: a loose jigsaw piece appears; she taps-to-drop it into the trip-map jigsaw (tracked as her own completion)
  3. Coupon text + points earned
- Past uncompleted days remain open for catch-up.
- Home screen shows the **trip-map jigsaw** growing as pieces are placed, plus total points and sticker count.

### Activity types

| Type | How it's completed |
|---|---|
| `riddle` | Kid types answer into a text input. Server checks (case-insensitive, trimmed, collapsed whitespace; alternates allowed via `\|`). Wrong answer shows soft feedback; no attempt limit. |
| `quiz` | Same mechanism as riddle (multi-step quizzes out of scope — one answer per day). |
| `creative` | Kid uploads a photo. Server stores it; completion recorded on successful upload. |
| `kindness` | Kid taps "We did it!" button; honor system. |

### Duration constraint

Every activity must be completable by a 10yo in **15–30 minutes** with light supervision. Admin edit form exposes an `expected_minutes` field (integer) as an authoring reminder.

### 4yo's role (jigsaw piece placement)

The 4yo's daily moment is placing the day's **jigsaw piece** onto the trip-map puzzle. When the reveal sequence reaches step 2, a loose piece appears at the bottom of the screen; she drags or taps it and it snaps into its slot on the map with a celebration animation. This is recorded as `kid_tile_completion` for that day and updates the home-screen jigsaw.

The piece becomes available only after the main activity is completed, so the two kids coordinate naturally (10yo solves → 4yo places).

### Reveal sequence

A staged flow (not a single screen — each step transitions with a tap/continue):

1. **Media step** — plays the day's media asset. Normally a short travel clip (10–30 sec) from where Dad is/was. On designated **special days** (see below) the media is different: Day 5 = Grandma voice note with still image, Day 7 = animated postcard graphic, Day 9 = montage of all travel clips stitched together.
2. **Jigsaw piece step** — loose piece appears; 4yo taps/drags it into place on a mini trip-map puzzle. Snaps in with an animation. Records `kid_tile_completion`.
3. **Coupon + points step** — shows coupon text (e.g., "🍦 Ice cream after dinner") and points earned. Includes a "Show Mummy" button that does nothing beyond ceremony.

If `video_storage_path IS NULL` at the time of reveal: step 1 shows "Daddy's surprise is coming soon 💌" with a still fallback image. Page revalidates on focus so the asset appears once uploaded. Steps 2 and 3 always proceed.

### Trip-map jigsaw (meta-game)

- A 9-piece SVG jigsaw depicting Dad's trip route (SIN → SFO → LAS → SFO → SIN) with landmark illustrations.
- Each of the 9 pieces corresponds to one day (piece `n` = day `n`).
- Home screen always renders the jigsaw — missing pieces show a ghost outline, placed pieces show the illustration.
- The jigsaw state is derived from `kid_tile_completions` rows (presence of row for day `n` = piece `n` placed).
- One static image is split into 9 SVG `<g>` groups, each with a target transform. Asset authored in vector form and checked into the repo.

### Final reward (day 9)

Day 9's reveal includes an additional "big surprise" step **only if both** conditions are met at the time the day 9 reveal loads:

1. Trip-map jigsaw is complete (9/9 pieces placed, i.e., 9 rows in `kid_tile_completions`)
2. Total points ≥ 100 (sum of `days.points` across rows present in `completions`)

If either condition fails, the "big surprise" step is hidden (not teased). Thresholds are code constants.

## Unlock logic

- Authoritative on the server only. Every route that could leak activity content calls:
  ```
  isUnlocked(day, actor) = actor.isAdmin || now_in_sgt() >= day.unlock_at
  ```
- `unlock_at` is stored as `timezone('Asia/Singapore', ...)` in Postgres.
- Kid's client shows a countdown to next unlock, computed from `unlock_at` sent to the client only for dates whose `unlock_at` is known — which is all 9 dates, since unlock times are public (only activity content is hidden).
- Admin `override` endpoint sets `unlock_at` to `now()` for a specific day.

## Tech stack

- **Framework:** Next.js 15 (App Router), TypeScript
- **Hosting:** Vercel (single project, `main` = production)
- **Database + Auth + Storage:** Supabase (free tier)
- **Styling:** Tailwind CSS
- **Validation:** Zod (both client and server)
- **Testing:** Vitest (unit + integration), Playwright (E2E)

### Why this stack

- Lowest engineering risk for a 2-day build
- Supabase Auth handles admin magic-link out of the box
- Supabase Storage handles video + photo uploads with signed URLs
- Vercel deploy is ~5 minutes from first push
- Free tier covers expected load (3 users, <1GB video assets)

## Data model

Six Postgres tables (Supabase).

### `days`
Seeded with all 9 rows at migration time.

| Column | Type | Notes |
|---|---|---|
| `day_number` | `int PRIMARY KEY` | 1–9 |
| `date` | `date NOT NULL` | 2026-04-17 … 2026-04-25 |
| `unlock_at` | `timestamptz NOT NULL` | `date 15:00 Asia/Singapore` |
| `activity_type` | `text NOT NULL CHECK (activity_type IN ('riddle','quiz','creative','kindness'))` | |
| `activity_title` | `text NOT NULL` | e.g., "The Secret Code" |
| `activity_body` | `text NOT NULL` | Markdown rendered client-side |
| `activity_answer` | `text` | NULL for creative/kindness; `\|`-separated alternates allowed for riddle/quiz |
| `expected_minutes` | `int NOT NULL DEFAULT 15` | Authoring hint; 5/15/30 typical |
| `media_type` | `text NOT NULL CHECK (media_type IN ('video','audio_with_image','animated_postcard','montage'))` | Drives reveal step 1 rendering |
| `coupon_text` | `text NOT NULL` | |
| `points` | `int NOT NULL DEFAULT 10` | |
| `media_storage_path` | `text` | NULL if not uploaded yet. Video/audio file key. |
| `media_still_path` | `text` | Optional poster image / still shown for audio days |
| `postcard_config` | `jsonb` | Only used when `media_type = 'animated_postcard'`; holds text/emoji/colors |

### `completions`
| Column | Type | Notes |
|---|---|---|
| `day_number` | `int PRIMARY KEY REFERENCES days(day_number)` | |
| `completed_at` | `timestamptz NOT NULL DEFAULT now()` | |
| `photo_storage_path` | `text` | NULL unless creative |
| `notes` | `text` | Optional free-text |

Upsert semantics: duplicate completion is a no-op.

### `kid_tile_completions`
Records the 4yo's jigsaw-piece placements. One row per day = one piece placed.

| Column | Type | Notes |
|---|---|---|
| `day_number` | `int PRIMARY KEY REFERENCES days(day_number)` | |
| `completed_at` | `timestamptz NOT NULL DEFAULT now()` | |

### `admin_users`
| Column | Type | Notes |
|---|---|---|
| `email` | `text PRIMARY KEY` | Lowercased at write time |

### `household_pin`
Single-row table (`CHECK (id = 1)`).

| Column | Type | Notes |
|---|---|---|
| `id` | `int PRIMARY KEY DEFAULT 1` | Always 1 |
| `pin_hash` | `text NOT NULL` | bcrypt |
| `updated_at` | `timestamptz NOT NULL DEFAULT now()` | |

### `login_attempts`
| Column | Type | Notes |
|---|---|---|
| `ip` | `text PRIMARY KEY` | |
| `failed_count` | `int NOT NULL DEFAULT 0` | |
| `blocked_until` | `timestamptz` | NULL if not blocked |

### `audit_log`
Append-only.

| Column | Type | Notes |
|---|---|---|
| `id` | `bigserial PRIMARY KEY` | |
| `ts` | `timestamptz NOT NULL DEFAULT now()` | |
| `actor` | `text NOT NULL` | `"kid"` or admin email |
| `action` | `text NOT NULL` | e.g., `"completed_day"`, `"admin_override"` |
| `payload` | `jsonb NOT NULL DEFAULT '{}'` | |

### Storage buckets

- `media/` (private) — per-day reveal asset (video or audio), convention: `day-{n}.{ext}`
- `stills/` (private) — optional poster/still images for audio days, convention: `day-{n}-still.jpg`
- `photos/` (private) — kid creative uploads, convention: `day-{n}-{timestamp}.jpg`

All access via server-issued signed URLs. No public buckets.

### Static assets (in repo, not Supabase)

- `public/jigsaw/map.svg` — the trip-map jigsaw, with 9 `<g id="piece-1">` … `<g id="piece-9">` groups and matching slot outlines
- `public/jigsaw/pieces/piece-{n}.svg` — individual piece for the loose-piece animation step

## API surface

All routes are Next.js route handlers. Server-only; no direct client writes to Supabase.

### Kid routes

| Route | Method | Behavior |
|---|---|---|
| `/api/kid-auth` | POST | Body `{pin}`. Bcrypt-compares to `household_pin.pin_hash`. On success, sets signed HTTP-only cookie `kid_session` (30-day expiry, `HttpOnly`, `Secure`, `SameSite=Lax`). On 5 failures per IP, set `blocked_until = now() + 15m`. |
| `/api/today` | GET | Returns `{day_number, date, unlock_at, activity_type, activity_title, activity_body, media_type, completed, kid_tile_completed, total_points, jigsaw_state: [bool × 9]}`. `activity_*` fields are NULL unless unlocked. |
| `/api/days/[n]` | GET | Same shape as `/api/today` but for any past day. Returns 403 for future unlocked days. |
| `/api/days/[n]/attempt` | POST | Body `{answer}`. Riddle/quiz only. Server normalizes and compares. On match, insert `completions` row. Return `{correct: bool}`. |
| `/api/days/[n]/creative` | POST | Multipart upload. Server writes to `photos/` bucket, inserts `completions` row with `photo_storage_path`. |
| `/api/days/[n]/kindness` | POST | Inserts `completions` row. |
| `/api/days/[n]/kid-tile` | POST | Inserts `kid_tile_completions` row for day `n`. Idempotent. Requires `completions` row already present for day `n` (main activity must come first). |
| `/api/days/[n]/reveal` | GET | Returns `{media_type, media_signed_url, media_still_signed_url, postcard_config, coupon_text, points, final_reward_unlocked, jigsaw_state}`. 403 if not completed or not unlocked. Signed URL TTL: 1 hour. `final_reward_unlocked` is `true` only when `n=9` AND jigsaw complete AND total points ≥ 100. |

### Admin routes

All gated by Supabase session + `admin_users` membership check (middleware).

| Route | Method | Behavior |
|---|---|---|
| `/api/admin/days` | GET | Full 9-day array including answers. |
| `/api/admin/days/[n]` | PUT | Body is a day patch (Zod-validated). |
| `/api/admin/days/[n]/media` | POST | Multipart upload to `media/` bucket, sets `media_storage_path`. Accepts `mp4\|webm\|mov\|m4a\|mp3`, ≤200MB. |
| `/api/admin/days/[n]/still` | POST | Optional upload to `stills/` bucket (used for audio days). Accepts `jpg\|png\|webp`, ≤10MB. |
| `/api/admin/days/[n]/override` | POST | Sets `unlock_at = now()`. |
| `/api/admin/days/[n]/reset` | POST | Deletes `completions` and `kid_tile_completions` rows for that day. |
| `/api/admin/pin` | PUT | Body `{new_pin}`. Bcrypts and stores. |

## Pages

- `/login` — two panels: kid PIN entry on the left, admin "send magic link" on the right
- `/` — kid home: 3×3 door grid at top, **trip-map jigsaw** below (growing as pieces are placed), total points pill at top right. Doors are `locked` (dim), `today` (pulsing gradient), `done` (green check), `missed` (still tappable, amber tint). Countdown to next unlock under the grid.
- `/day/[n]` — activity + reveal flow. State machine: `locked` → `activity` → `reveal-media` → `reveal-jigsaw` → `reveal-coupon` → (`reveal-big-surprise` if day 9 and unlocked) → `done`. Each state is a full-height screen with a single "Continue" tap to advance.
- `/admin` — calendar grid showing all 9 days with status badges (`authored` / `video uploaded` / `completed`)
- `/admin/day/[n]` — edit form (all fields), video uploader, override/reset buttons, preview pane

## Authentication details

**Kid PIN:**
- 4-digit numeric; rotatable via admin UI
- Stored bcrypt-hashed (cost 10)
- Session cookie signed with `KID_SESSION_SECRET` (HMAC-SHA256); 30-day expiry
- Rate-limiting: `login_attempts` table, 5 failures per IP → 15-min block

**Admin:**
- Supabase Auth magic link
- `admin_users.email` is the allow-list; non-listed emails get a generic "not authorized" after click-through (no account enumeration)
- Session managed by Supabase client

## Error handling & edge cases

| Scenario | Behavior |
|---|---|
| Wrong riddle/quiz answer | Soft inline feedback: "Not quite — try again!". No attempt limit. |
| Kid opens before 3pm | Today tile shows locked state + live countdown. `/api/today` returns no `activity_*` fields. |
| Kid misses a day | Past date remains tappable; activity functions normally. No penalty, no different UI besides "Day X (caught up)" on reveal. |
| Media not yet uploaded | Reveal-media step shows a still fallback + "Daddy's surprise is coming soon 💌". User can continue to jigsaw + coupon as normal. Page revalidates on window focus. |
| Invalid media file (format/size) | Admin uploader shows explicit error; nothing persisted. |
| 4yo tries to place jigsaw before main activity done | API returns 400. UI only exposes the piece after `completions` row exists. |
| Piece already placed | Idempotent upsert on `kid_tile_completions`. |
| PIN brute force | 5 failures per IP → 15-min lockout. Lockout check precedes bcrypt compare. |
| Network fails mid creative upload | Client auto-retries once; on second failure, user-visible "Tap to try uploading again". Completion only recorded after successful server-side write. |
| Duplicate completion POSTs | Idempotent via `UNIQUE` constraint; server returns 200 either way. |
| Admin override while kid on page | Kid page polls `/api/today` on window focus + every 60s while visible. |
| Kid session expires | Redirect to `/login` with `return_to` query param. |
| Timezone / DST | Server uses SGT explicitly (no DST). All comparisons server-side. |

## Content scaffold (9 days)

Content authored in admin UI post-deploy. Seed migration inserts placeholder strings (`[TODO: …]`). Suggested themes:

| Day | Date (SGT) | Type | Theme | Duration | Media type | Media source |
|---|---|---|---|---|---|---|
| 1 | Fri 17 Apr | riddle | "Where's Daddy going?" — airplane/city clue | 10 min | video | Pre-recorded before trip (selfie from SIN airport) |
| 2 | Sat 18 Apr | creative | "Draw a San Francisco landmark" — upload photo | 20 min | video | Pre-recorded before trip OR Golden Gate clip if captured Day 1 |
| 3 | Sun 19 Apr | quiz | 5-question geography quiz (SFO/LAS/time zones) | 10 min | video | Pre-recorded before trip |
| 4 | Mon 20 Apr | kindness | "Write a thank-you note to Grandma" | 15 min | video | Fresh — landmark clip from Vegas (ATP) |
| 5 | Tue 21 Apr | riddle | Cryptic puzzle about Google | 10 min | **audio_with_image** | **Grandma voice note** + still image of Grandma |
| 6 | Wed 22 Apr | creative | "Design a patch for Dad's luggage" — draw + upload | 20 min | video | Fresh — The Sphere or Next keynote clip |
| 7 | Thu 23 Apr | quiz | Fun facts from Google Next | 10 min | **animated_postcard** | **Silly postcard graphic** with souvenir fact (no video needed) |
| 8 | Fri 24 Apr | kindness | "Do something nice for your little sister" | 15 min | video | Fresh — departing-Vegas clip |
| 9 | Sat 25 Apr | riddle | "Where is Daddy right now?" — answer: `home`/`singapore` | 10 min | **montage** | Stitched montage of all prior travel clips |

**Jigsaw piece rotation:** one piece per day (piece 1 on day 1, piece 9 on day 9). Pieces placed by 4yo in reveal-jigsaw step. Animation: piece slides from bottom to its slot with a satisfying snap + sparkle.

**Points ramp:** 10 per day for days 1–3, 15 for days 4–6, 20 for days 7–9. Total: 135 (threshold for final reward: 100, AND jigsaw complete).

## Testing

- **Unit (Vitest):** answer normalization, PIN hashing/compare, unlock-time check, point totalling, jigsaw-completeness check, final-reward gate, signed-URL issuer wrapper
- **Integration (Vitest + supabase-js test client against a test project):** each API route's auth gate, unlock gate, completion flow (upsert idempotency, audit log writes), `kid-tile` ordering constraint (main completion first)
- **E2E (Playwright, ~6 scenarios):**
  1. Kid PIN login → locked today → wait-for-clock-skip → correct riddle answer → reveal: media → jigsaw piece placed → coupon
  2. Kid creative day: upload a PNG → 3-step reveal plays through
  3. Kid kindness day: tap button → 3-step reveal plays through
  4. Admin magic-link login → edit day 3 → upload media → observe reflected on kid reveal
  5. Unlock-gate: GET `/api/today` before 3pm SGT returns no `activity_body`; after returns it (manipulate DB `unlock_at` in test)
  6. Day 9 final-reward: seed 8 completed days + 8 placed pieces + points ≥100 → complete day 9 → `final_reward_unlocked = true` step renders. Then test the negative (points < 100) → step hidden.
- **Manual smoke before 17 Apr:** seed all 9 days with `unlock_at = now()`, walk through each activity type end-to-end on a real phone (both iOS Safari and Android Chrome), verify video playback and photo upload.

## Deployment

- Vercel GitHub integration — `main` = production
- Environment variables set in Vercel dashboard:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `KID_SESSION_SECRET` (32-byte hex)
  - `ADMIN_EMAILS` (comma-separated lowercase)
- Supabase migrations via `supabase/migrations/*.sql`, applied manually with `supabase db push` before first deploy
- Custom domain optional; Vercel-generated domain is fine for family use

## Scope boundaries (what this spec does NOT cover)

- Push notifications (explicitly out — ritual-based timing instead)
- Multi-household support (single household hard-coded)
- Per-kid accounts (shared PIN is intentional)
- Content authoring UX beyond a form (no rich editor, no media library)
- Analytics / telemetry
- i18n (English only)
- Accessibility audit beyond basic semantic HTML (family-use tool, not public)
- Offline/PWA install (online-only)

## Open questions (to resolve during implementation)

- Exact 4-digit PIN value — to be set by admin post-deploy via admin UI
- Email addresses for the admin allow-list — to be provided at env-var setup time
- Final reward identity ("the big surprise") — decided offline by parents; not in code
