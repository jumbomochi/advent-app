# Design System — Crayon Adventure Theme

Addendum to `2026-04-14-advent-app-design.md`. Locks in visual language + animation scope for the kid-facing UI.

## Visual direction

**"Crayon Adventure" — hand-drawn travel journal kept by a child.** Pages of a scrapbook filled with wobbly lines, marker handwriting, crayon-textured illustrations. Warm, playful, homemade.

## Palette (Tailwind CSS variables)

Design tokens are declared in `src/app/globals.css` as CSS custom properties and consumed via Tailwind v4 `@theme`. Minimum palette:

| Token | Value | Use |
|---|---|---|
| `--color-paper` | `#fefce8` | Page background (warm cream) |
| `--color-ink` | `#0f172a` | Body text, outlines |
| `--color-accent` | `#dc2626` | Brand accent, "today" highlights (crayon red) |
| `--color-sun` | `#facc15` | Highlights, points pill (marker yellow) |
| `--color-sky` | `#60a5fa` | Cool counterpoint, locked doors (pencil blue) |
| `--color-grass` | `#4ade80` | Completed-state (green) |
| `--color-orchid` | `#c084fc` | Day 9 finale accents |

Gradients are used sparingly — this is not a "glossy" theme. Flat fills + hand-drawn outlines are the default.

## Typography

- **Display / headings:** `"Caveat Brush"` (loaded from Google Fonts via `next/font`), fallback `"Marker Felt"`, `system-ui`, `sans-serif`. Used for titles, buttons, and the doors themselves.
- **Body / UI:** `"Fredoka"` (Google Fonts, weights 400/500/700), fallback `system-ui`. Rounded geometric sans-serif — reads as friendly but neutral.

Both fonts are loaded via `next/font/google` in `src/app/layout.tsx` (zero-runtime, no FOUT). Any component using the display font references the `font-display` Tailwind utility; body is the default.

## Shape language

- **Border radius:** 8–12px on small chips, 16–20px on cards/doors. Not overly round — the hand-drawn vibe prefers slight imperfection.
- **Borders:** always visible, `3px solid var(--color-ink)`. Reads as "drawn outline".
- **Drop shadows:** hard offset shadows, no blur — e.g., `5px 5px 0 var(--color-ink)`. Simulates the offset that happens when a sticker's peeled and re-pressed slightly out of place.
- **Rotation:** doors and stickers get a small rotation (`rotate(-2deg)` / `rotate(1.5deg)` / `rotate(-1deg)`), alternating across the grid. "Today" door sits upright and slightly scaled up.
- **Dashed borders** for ghost/empty states (jigsaw slots before pieces are placed).

## Animation (subtle everywhere)

All animations are CSS-based, under 400ms, and respect `prefers-reduced-motion`.

| Element | Animation |
|---|---|
| Door tap (press) | `active:translate-y-0.5 active:shadow-[2px_2px_0_var(--color-ink)]` — sticks to the page briefly |
| Today's door (idle) | `animate-wiggle` — custom keyframe: ±1.5° rotation, 3s loop |
| Jigsaw piece drop | slides in from bottom over 600ms with easing, ends with a 120ms "settle" scale (1.05 → 1.0) |
| Correct answer | subtle confetti burst (SVG, ~8 particles, 1s fade), scale-bounce on the reveal container |
| Wrong answer | 80ms shake on the input |
| Reveal screen transitions | 200ms fade + slight translateY between steps |
| Points pill on increment | +1 tick animation: scale pulse + number count-up over 600ms |
| Countdown timer | digit flip ticks each second — kept small to avoid visual noise |

Celebrations are reserved for **completion moments** (riddle solved, piece placed, day done). Everything else stays quiet.

Implementation: use Tailwind's built-in animations where possible (`animate-bounce`, `animate-pulse`), custom keyframes in `globals.css` (`@keyframes wiggle`, `@keyframes piece-drop`, `@keyframes shake`, `@keyframes confetti`). A thin `motion.tsx` component wraps `prefers-reduced-motion` into class-level opt-out.

## Responsive layout

- **Primary breakpoint: phone portrait** (320–430px wide). Every screen must work here first.
- **Secondary: phone landscape / small tablet** (up to ~900px). Doors grid stays 3×3, jigsaw strip below may widen.
- **Tablet portrait (iPad, 768–1024px)** — content caps at `max-w-md` (448px) center-aligned, with a bit more breathing room. No layout change.
- **Desktop** — same as tablet portrait. The app is intentionally phone-first. Extra width = extra decorative margin (paper-texture background).

Use CSS `clamp()` for key font sizes: `clamp(16px, 4vw, 20px)` on the door numbers.

## Asset strategy

The app ships with **user-generated PNG illustrations** for the 9 trip-map jigsaw pieces and a handful of supporting images, generated externally via an AI image tool using the prompts in `docs/superpowers/specs/2026-04-14-advent-app-asset-prompts.md`. Until those land, the 9 pieces fall back to emoji placeholders (already authored in the plan).

Asset filenames (all checked into `public/jigsaw/pieces/`):
- `piece-1.png` through `piece-9.png` — trip-map waypoints, 512×512px, transparent PNG or cream background
- `public/brand/logo.png` — gift-wrapped box with ribbon (app header + favicon)
- `public/brand/paper-texture.png` (optional, tiled) — subtle paper background

Each piece is a square, so it can drop into a flexible-width jigsaw strip. The map itself is 9 adjacent squares in a row (horizontal scroll on very narrow phones, natural fit on tablet+).

## Component updates vs. the implementation plan

The plan (`2026-04-14-advent-app.md`) used neutral Tailwind classes. During implementation, components and pages should adopt the tokens and conventions above. Specifically:

- `DoorGrid`: apply door rotations, offset shadows, `font-display`, use palette tokens
- `TripMapJigsaw`: 9 piece slots as dashed-border squares, fill with placed PNGs, piece-drop keyframe on transitions
- `CountdownTimer`: wrap digits in a marker-styled chip
- Reveal components: use the celebration animations listed above
- Activity components: sized-up tap zones (min `min-h-14` on inputs/buttons), `font-display` for titles
- Admin UI is utilitarian — can keep plain Tailwind (not part of the kid experience)
