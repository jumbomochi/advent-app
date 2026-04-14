# AI Asset Generation Prompts

Generate all 9 jigsaw-piece illustrations + brand assets using the shared style below. Works well in Midjourney, DALL-E, Gemini Imagen, or Stable Diffusion. Run them in the same session with the same style tags to maximize consistency.

## Shared style prompt (prepend to every image)

> **Hand-drawn children's book illustration, crayon and marker texture, thick confident black outlines, flat bright fills with subtle crayon grain, warm cream/yellow paper background (`#fefce8`), imperfect wobbly lines, slight scrapbook feel, friendly playful, limited palette of warm reds (`#dc2626`), marker yellow (`#facc15`), sky blue (`#60a5fa`), leaf green (`#4ade80`). No text, no people's faces in detail. Square 1:1 composition, subject centered with generous padding. No photorealism, no 3D render, no glossy gradients. Style consistent across a series of 9 images — same linework weight, same shading, same palette.**

## Technical settings

- **Size:** 1024×1024 (we'll compress to ~512 for web)
- **Format:** PNG with transparent OR cream `#fefce8` background (either works; the app background matches)
- **Aspect ratio:** 1:1 (square)
- **Negative prompt (SD/DALL-E):** `photorealistic, 3d render, glossy, gradient mesh, text, letters, watermark, signature, human faces in detail, blurry, low contrast`

## Per-piece prompts

Append each of these to the shared style prompt. Save files as `piece-1.png` through `piece-9.png`.

### piece-1.png — Singapore departure
> A Merlion statue next to Marina Bay Sands hotel silhouette, with a small red airplane taking off in the sky. Bright sunny sky blue, warm red accents on the airplane tail. Represents "start of the journey — leaving Singapore".

### piece-2.png — Over the Pacific
> A cheerful cartoon airplane with a smiling face, flying through fluffy cream-colored clouds. A few small yellow stars. The sun in the corner. Represents "flying across the ocean".

### piece-3.png — San Francisco Golden Gate
> The Golden Gate Bridge in crayon style, warm red-orange, with small green hills behind it and a couple of seagulls. Represents "arrived in San Francisco".

### piece-4.png — California road trip
> A road-trip scene: a winding highway, desert cactus, distant mountains, a small yellow car driving across. Warm earthy colors. Represents "road trip from SF to Vegas".

### piece-5.png — Las Vegas arrival
> The Sphere in Las Vegas (a giant globe/ball-shaped building lit up) with neon-style lines around it, a few palm trees, stylized playing cards fluttering. Playful "Vegas" vibe but kid-friendly. Represents "we're in Vegas".

### piece-6.png — Conference day 1
> A big Google-style colorful rainbow arch over a speaker's podium, with a microphone and a laptop. A thought bubble with a lightbulb. Represents "Dad's at a technology conference".

### piece-7.png — Conference day 2
> A stage with three rainbow-colored spotlight beams, a simple silhouette figure presenting, and a row of stylized audience seats. Represents "Google Next keynote".

### piece-8.png — Flying home
> A cheerful airplane flying over a small globe/Earth, with a trailing dotted line connecting a red dot (USA) to a red dot (Asia). Represents "flying back home".

### piece-9.png — Home sweet home
> A cozy house with a red roof, a yellow door with a ribbon (like a gift), two small stick-figure children waving, a heart above the roof. The word "HOME" is NOT drawn (we'll overlay text in CSS). Represents "Dad is back".

## Brand assets (optional, nice-to-have)

### logo.png — App logo/favicon
> A gift-wrapped box with a bright red ribbon and bow, slightly wonky as if drawn by a child, small sparkle stars around it. Transparent background. Represents "Daddy's Advent". Save to `public/brand/logo.png` and also export as `public/favicon.ico` (32×32).

### paper-texture.png (very optional, low priority)
> Subtle beige/cream paper texture with faint grid-like pencil marks and small crayon scribbles in the corners. Tileable. Low contrast so UI text remains readable. Represents "scrapbook page".

## Consistency tips

1. **Generate all 9 pieces in the same AI session** — models hold context and style consistency within a session
2. **Use the same seed** if your tool supports it (e.g., Midjourney `--seed 12345`)
3. **Review as a strip** — put all 9 side-by-side before committing. If one jumps out as stylistically different, regenerate just that one
4. **Keep it low-fidelity** — don't chase photorealism. The crayon imperfection is the point

## Delivery

Drop the final PNGs at:
- `public/jigsaw/pieces/piece-1.png` … `piece-9.png`
- `public/brand/logo.png`
- `public/favicon.ico` (32×32 version of the logo)
- `public/brand/paper-texture.png` (optional)

The app will detect and swap in PNGs where `piece-{n}.png` exists; otherwise it falls back to the emoji SVG placeholders from the plan's Task 14.
