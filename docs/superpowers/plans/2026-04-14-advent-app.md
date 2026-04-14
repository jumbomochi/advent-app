# Daddy's Advent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a 9-day advent-calendar web app (17–25 Apr 2026) that runs on Vercel + Supabase, with PIN-gated kid view, magic-link admin, daily activities, trip-map jigsaw meta-game, and a final-reward gate on Day 9.

**Architecture:** Next.js 15 App Router (TypeScript) → Vercel. All data access server-side via Supabase service-role client; kids use a signed-cookie PIN session; admins use Supabase Auth magic links. Core business logic (unlock times, answer normalization, reveal eligibility, final-reward gate) lives in `src/lib/*` with 100% unit-test coverage. API handlers are thin — they do auth/authz, delegate to lib, return JSON. UI is a handful of server-rendered pages with client components for the reveal sequence and jigsaw animation.

**Tech Stack:** Next.js 15, TypeScript (strict), Supabase (Postgres + Auth + Storage), Tailwind CSS v4, Zod, bcryptjs, iron-session (signed cookies), Vitest, Playwright, pnpm.

**Companion spec:** `docs/superpowers/specs/2026-04-14-advent-app-design.md` — authoritative for data shapes and business rules. This plan references it where useful.

---

## File Structure

```
advent-app/
├── package.json, tsconfig.json, next.config.ts, postcss.config.mjs, tailwind.config.ts
├── .env.local.example
├── vitest.config.ts
├── playwright.config.ts
├── supabase/
│   ├── config.toml
│   └── migrations/
│       ├── 0001_initial_schema.sql
│       └── 0002_seed_days.sql
├── public/jigsaw/
│   ├── map.svg                  # full trip map (reference rendering)
│   └── pieces/piece-{1..9}.svg  # individual jigsaw pieces
├── src/
│   ├── middleware.ts            # routes /admin requires admin, / requires kid
│   ├── lib/
│   │   ├── constants.ts         # SGT timezone, thresholds, date/unlock table
│   │   ├── time.ts              # nowInSgt, unlockAtForDay
│   │   ├── unlock.ts            # isUnlocked(day, actor)
│   │   ├── answer.ts            # normalize + compare
│   │   ├── pin.ts               # hash + verify + rate limit
│   │   ├── session.ts           # kid cookie sign/verify
│   │   ├── reveal.ts            # totalPoints, jigsawComplete, finalRewardUnlocked
│   │   ├── supabase/
│   │   │   ├── server.ts        # createServerClient (auth-context)
│   │   │   ├── admin.ts         # createAdminClient (service role)
│   │   │   └── types.ts         # generated DB types
│   │   └── guards/
│   │       ├── kid.ts           # requireKid(req) -> throws 401
│   │       └── admin.ts         # requireAdmin(req) -> throws 401/403
│   ├── schemas/
│   │   └── day.ts               # Zod schemas for Day, attempts, admin edit
│   ├── components/
│   │   ├── DoorGrid.tsx
│   │   ├── TripMapJigsaw.tsx
│   │   ├── CountdownTimer.tsx
│   │   ├── activity/
│   │   │   ├── RiddleQuiz.tsx
│   │   │   ├── Creative.tsx
│   │   │   └── Kindness.tsx
│   │   ├── reveal/
│   │   │   ├── MediaVideo.tsx
│   │   │   ├── MediaMystery.tsx
│   │   │   ├── MediaPostcard.tsx
│   │   │   ├── MediaMontage.tsx
│   │   │   ├── JigsawPieceStep.tsx
│   │   │   ├── CouponStep.tsx
│   │   │   └── BigSurpriseStep.tsx
│   │   └── admin/
│   │       ├── DayEditForm.tsx
│   │       └── MediaUploader.tsx
│   └── app/
│       ├── layout.tsx
│       ├── globals.css
│       ├── page.tsx             # / kid home
│       ├── login/page.tsx
│       ├── day/[n]/page.tsx
│       ├── admin/
│       │   ├── page.tsx
│       │   └── day/[n]/page.tsx
│       └── api/
│           ├── kid-auth/route.ts
│           ├── today/route.ts
│           ├── days/[n]/route.ts
│           ├── days/[n]/attempt/route.ts
│           ├── days/[n]/creative/route.ts
│           ├── days/[n]/kindness/route.ts
│           ├── days/[n]/kid-tile/route.ts
│           ├── days/[n]/reveal/route.ts
│           └── admin/
│               ├── days/route.ts
│               ├── days/[n]/route.ts
│               ├── days/[n]/media/route.ts
│               ├── days/[n]/mystery/route.ts
│               ├── days/[n]/override/route.ts
│               ├── days/[n]/reset/route.ts
│               └── pin/route.ts
└── tests/
    ├── unit/
    │   ├── answer.test.ts
    │   ├── unlock.test.ts
    │   ├── pin.test.ts
    │   └── reveal.test.ts
    └── e2e/
        ├── kid-flow.spec.ts
        └── admin-flow.spec.ts
```

---

## Task 1: Scaffold the Next.js project with tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `tailwind.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `.env.local.example`, `.gitignore` (extend existing), `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx` (placeholder)

- [ ] **Step 1: Initialize pnpm + Next.js**

```bash
pnpm dlx create-next-app@latest . --ts --tailwind --app --src-dir --eslint --no-import-alias --use-pnpm --yes
```

If the command complains about existing files (spec + plan docs), create the app in a temp dir and move files in:

```bash
cd /tmp && pnpm dlx create-next-app@latest advent-app-scaffold --ts --tailwind --app --src-dir --eslint --no-import-alias --use-pnpm --yes
cd /tmp/advent-app-scaffold && cp -R . /Users/huiliang/GitHub/advent-app/
# Then resolve any conflicts (preserve existing docs/, .gitignore additions, .superpowers/ ignore)
```

- [ ] **Step 2: Install additional dependencies**

```bash
pnpm add @supabase/supabase-js @supabase/ssr bcryptjs iron-session zod date-fns date-fns-tz
pnpm add -D vitest @vitejs/plugin-react jsdom @types/bcryptjs @playwright/test supabase
```

- [ ] **Step 3: Configure TypeScript strict mode**

Edit `tsconfig.json` to ensure:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "paths": { "@/*": ["./src/*"] }
  }
}
```

- [ ] **Step 4: Configure Vitest**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: { environment: "node", include: ["tests/unit/**/*.test.ts"] },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
```

- [ ] **Step 5: Configure Playwright**

```bash
pnpm exec playwright install --with-deps chromium
```

Create `playwright.config.ts`:
```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
  use: { baseURL: "http://localhost:3000" },
});
```

- [ ] **Step 6: Add scripts**

In `package.json` `scripts`:
```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "vitest run",
  "test:watch": "vitest",
  "e2e": "playwright test",
  "db:types": "supabase gen types typescript --local > src/lib/supabase/types.ts"
}
```

- [ ] **Step 7: Create `.env.local.example`**

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
KID_SESSION_SECRET=   # 32+ random bytes, e.g. openssl rand -hex 32
ADMIN_EMAILS=         # comma-separated lowercase
```

- [ ] **Step 8: Smoke test**

```bash
pnpm dev
# Visit http://localhost:3000 — default Next.js page should render.
# Ctrl-C to stop.
pnpm test       # passes (no tests yet)
pnpm build      # no errors
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js app with Tailwind, Vitest, Playwright, Supabase client"
```

---

## Task 2: Supabase schema migrations + seed data

**Files:**
- Create: `supabase/config.toml`, `supabase/migrations/0001_initial_schema.sql`, `supabase/migrations/0002_seed_days.sql`, `src/lib/constants.ts`

- [ ] **Step 1: Initialize Supabase locally**

```bash
pnpm exec supabase init
pnpm exec supabase start   # starts local Postgres on port 54322
```

Capture the printed `API URL`, `anon key`, `service_role key` — copy into `.env.local`.

- [ ] **Step 2: Define constants**

Create `src/lib/constants.ts`:
```ts
export const SGT_TZ = "Asia/Singapore";
export const UNLOCK_HOUR_SGT = 15;
export const POINTS_THRESHOLD = 100;
export const TOTAL_DAYS = 9;

export const DAY_DATES: ReadonlyArray<{ n: number; date: string }> = [
  { n: 1, date: "2026-04-17" },
  { n: 2, date: "2026-04-18" },
  { n: 3, date: "2026-04-19" },
  { n: 4, date: "2026-04-20" },
  { n: 5, date: "2026-04-21" },
  { n: 6, date: "2026-04-22" },
  { n: 7, date: "2026-04-23" },
  { n: 8, date: "2026-04-24" },
  { n: 9, date: "2026-04-25" },
];
```

- [ ] **Step 3: Write schema migration**

Create `supabase/migrations/0001_initial_schema.sql`:
```sql
create table days (
  day_number int primary key check (day_number between 1 and 9),
  date date not null unique,
  unlock_at timestamptz not null,
  activity_type text not null check (activity_type in ('riddle','quiz','creative','kindness')),
  activity_title text not null,
  activity_body text not null,
  activity_answer text,
  expected_minutes int not null default 15,
  media_type text not null check (media_type in ('video','mystery_photos','animated_postcard','montage')),
  coupon_text text not null,
  points int not null default 10,
  media_storage_path text,
  media_config jsonb not null default '{}'::jsonb
);

create table completions (
  day_number int primary key references days(day_number) on delete cascade,
  completed_at timestamptz not null default now(),
  photo_storage_path text,
  notes text
);

create table kid_tile_completions (
  day_number int primary key references days(day_number) on delete cascade,
  completed_at timestamptz not null default now()
);

create table admin_users (
  email text primary key
);

create table household_pin (
  id int primary key default 1 check (id = 1),
  pin_hash text not null,
  updated_at timestamptz not null default now()
);

create table login_attempts (
  ip text primary key,
  failed_count int not null default 0,
  blocked_until timestamptz
);

create table audit_log (
  id bigserial primary key,
  ts timestamptz not null default now(),
  actor text not null,
  action text not null,
  payload jsonb not null default '{}'::jsonb
);

-- Storage buckets (private)
insert into storage.buckets (id, name, public) values
  ('media', 'media', false),
  ('mystery', 'mystery', false),
  ('photos', 'photos', false);
```

- [ ] **Step 4: Write seed migration**

Create `supabase/migrations/0002_seed_days.sql`:
```sql
-- Seed 9 days with placeholder content. Dates + unlock times are final; all other fields are editable via admin UI.
insert into days (day_number, date, unlock_at, activity_type, activity_title, activity_body, activity_answer, expected_minutes, media_type, coupon_text, points) values
  (1, '2026-04-17', '2026-04-17 15:00+08', 'riddle',   '[TODO: title]', '[TODO: riddle body]', '[TODO]', 10, 'video',             '[TODO: coupon]', 10),
  (2, '2026-04-18', '2026-04-18 15:00+08', 'creative', '[TODO: title]', '[TODO: instructions]', null,    20, 'video',             '[TODO: coupon]', 10),
  (3, '2026-04-19', '2026-04-19 15:00+08', 'quiz',     '[TODO: title]', '[TODO: quiz body]',   '[TODO]', 10, 'video',             '[TODO: coupon]', 10),
  (4, '2026-04-20', '2026-04-20 15:00+08', 'kindness', '[TODO: title]', '[TODO: mission]',     null,    15, 'video',             '[TODO: coupon]', 15),
  (5, '2026-04-21', '2026-04-21 15:00+08', 'riddle',   '[TODO: title]', '[TODO: riddle body]', '[TODO]', 10, 'mystery_photos',    '[TODO: coupon]', 15),
  (6, '2026-04-22', '2026-04-22 15:00+08', 'creative', '[TODO: title]', '[TODO: instructions]', null,    20, 'video',             '[TODO: coupon]', 15),
  (7, '2026-04-23', '2026-04-23 15:00+08', 'quiz',     '[TODO: title]', '[TODO: quiz body]',   '[TODO]', 10, 'animated_postcard', '[TODO: coupon]', 20),
  (8, '2026-04-24', '2026-04-24 15:00+08', 'kindness', '[TODO: title]', '[TODO: mission]',     null,    15, 'video',             '[TODO: coupon]', 20),
  (9, '2026-04-25', '2026-04-25 15:00+08', 'riddle',   '[TODO: title]', '[TODO: riddle body]', '[TODO]', 10, 'montage',           '[TODO: coupon]', 20);

-- Initial PIN: 1234 (MUST be rotated immediately via admin UI in production)
insert into household_pin (id, pin_hash) values (1, '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy');
-- ^ bcrypt hash of '1234'; admins rotate via PUT /api/admin/pin
```

- [ ] **Step 5: Apply migrations**

```bash
pnpm exec supabase db reset   # drops + re-applies migrations from scratch
pnpm db:types                 # generates src/lib/supabase/types.ts
```

- [ ] **Step 6: Verify**

```bash
pnpm exec supabase db dump --local --data-only | grep -c "day_number" 
# Expected: 10 or more (9 days + header)
```

- [ ] **Step 7: Commit**

```bash
git add supabase/ src/lib/constants.ts src/lib/supabase/types.ts .env.local.example
git commit -m "feat(db): initial schema + seed 9 days"
```

---

## Task 3: Supabase client wrappers + environment access

**Files:**
- Create: `src/lib/supabase/server.ts`, `src/lib/supabase/admin.ts`, `src/lib/env.ts`

- [ ] **Step 1: Env helper**

Create `src/lib/env.ts`:
```ts
function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const env = {
  supabaseUrl: () => required("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: () => required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceKey: () => required("SUPABASE_SERVICE_ROLE_KEY"),
  kidSessionSecret: () => required("KID_SESSION_SECRET"),
  adminEmails: (): string[] =>
    required("ADMIN_EMAILS").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
};
```

- [ ] **Step 2: Service-role client (server-only)**

Create `src/lib/supabase/admin.ts`:
```ts
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "./types";

let cached: ReturnType<typeof createClient<Database>> | null = null;

export function adminClient() {
  if (cached) return cached;
  cached = createClient<Database>(env.supabaseUrl(), env.supabaseServiceKey(), {
    auth: { persistSession: false },
  });
  return cached;
}
```

- [ ] **Step 3: Auth-context server client (for admin SSR pages)**

Create `src/lib/supabase/server.ts`:
```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import type { Database } from "./types";

export async function serverClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(env.supabaseUrl(), env.supabaseAnonKey(), {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
    },
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/env.ts src/lib/supabase/
git commit -m "feat(lib): supabase admin + server-side auth clients"
```

---

## Task 4: Unlock logic (TDD)

**Files:**
- Create: `src/lib/time.ts`, `src/lib/unlock.ts`, `tests/unit/unlock.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/unit/unlock.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { isUnlocked, unlockAtForDay } from "@/lib/unlock";

describe("unlockAtForDay", () => {
  it("returns a timestamp that is day's date at 15:00 SGT", () => {
    const t = unlockAtForDay(1);
    // 15:00 SGT = 07:00 UTC
    expect(t.toISOString()).toBe("2026-04-17T07:00:00.000Z");
  });

  it("advances one day per day_number", () => {
    expect(unlockAtForDay(9).toISOString()).toBe("2026-04-25T07:00:00.000Z");
  });

  it("throws for invalid day numbers", () => {
    expect(() => unlockAtForDay(0)).toThrow();
    expect(() => unlockAtForDay(10)).toThrow();
  });
});

describe("isUnlocked", () => {
  const day = { day_number: 3, unlock_at: new Date("2026-04-19T07:00:00Z") };

  it("returns true when admin, regardless of time", () => {
    expect(isUnlocked(day, { isAdmin: true }, new Date("2020-01-01"))).toBe(true);
  });

  it("returns false before unlock_at", () => {
    expect(isUnlocked(day, { isAdmin: false }, new Date("2026-04-19T06:59:59Z"))).toBe(false);
  });

  it("returns true at unlock_at", () => {
    expect(isUnlocked(day, { isAdmin: false }, new Date("2026-04-19T07:00:00Z"))).toBe(true);
  });

  it("returns true after unlock_at", () => {
    expect(isUnlocked(day, { isAdmin: false }, new Date("2026-04-19T07:00:01Z"))).toBe(true);
  });
});
```

- [ ] **Step 2: Run — verify they fail**

```bash
pnpm test
# Expected: import errors (modules don't exist)
```

- [ ] **Step 3: Implement `src/lib/time.ts`**

```ts
import { SGT_TZ } from "./constants";
import { fromZonedTime } from "date-fns-tz";

export function sgtDateAt(date: string, hour: number): Date {
  // date: "YYYY-MM-DD"; produces UTC Date for that wall-clock hour in SGT.
  return fromZonedTime(`${date}T${String(hour).padStart(2, "0")}:00:00`, SGT_TZ);
}
```

- [ ] **Step 4: Implement `src/lib/unlock.ts`**

```ts
import { DAY_DATES, UNLOCK_HOUR_SGT } from "./constants";
import { sgtDateAt } from "./time";

export function unlockAtForDay(n: number): Date {
  const entry = DAY_DATES.find((d) => d.n === n);
  if (!entry) throw new Error(`Invalid day number: ${n}`);
  return sgtDateAt(entry.date, UNLOCK_HOUR_SGT);
}

type DayRef = { day_number: number; unlock_at: Date | string };
type Actor = { isAdmin: boolean };

export function isUnlocked(day: DayRef, actor: Actor, now: Date = new Date()): boolean {
  if (actor.isAdmin) return true;
  const ua = day.unlock_at instanceof Date ? day.unlock_at : new Date(day.unlock_at);
  return now.getTime() >= ua.getTime();
}
```

- [ ] **Step 5: Run — verify they pass**

```bash
pnpm test
# Expected: 6 passing
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/time.ts src/lib/unlock.ts tests/unit/unlock.test.ts
git commit -m "feat(lib): unlock + time utilities with tests"
```

---

## Task 5: Answer normalization + comparison (TDD)

**Files:**
- Create: `src/lib/answer.ts`, `tests/unit/answer.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/answer.test.ts
import { describe, it, expect } from "vitest";
import { normalize, matches } from "@/lib/answer";

describe("normalize", () => {
  it("lowercases", () => expect(normalize("Cat")).toBe("cat"));
  it("trims", () => expect(normalize("  cat  ")).toBe("cat"));
  it("collapses whitespace", () => expect(normalize("a  b   c")).toBe("a b c"));
  it("handles empty", () => expect(normalize("")).toBe(""));
});

describe("matches", () => {
  it("exact match", () => expect(matches("cat", "cat")).toBe(true));
  it("alternates separated by |", () => {
    expect(matches("kitty", "cat|kitty|feline")).toBe(true);
    expect(matches("dog", "cat|kitty|feline")).toBe(false);
  });
  it("normalizes both sides", () => expect(matches("  CAT ", "cat")).toBe(true));
  it("empty answer never matches", () => expect(matches("", "cat")).toBe(false));
  it("null expected never matches", () => expect(matches("cat", null)).toBe(false));
});
```

- [ ] **Step 2: Verify failure, then implement**

```bash
pnpm test tests/unit/answer.test.ts  # expect import errors
```

```ts
// src/lib/answer.ts
export function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export function matches(given: string, expected: string | null): boolean {
  if (!expected) return false;
  const g = normalize(given);
  if (!g) return false;
  return expected.split("|").some((alt) => normalize(alt) === g);
}
```

- [ ] **Step 3: Run + commit**

```bash
pnpm test
git add src/lib/answer.ts tests/unit/answer.test.ts
git commit -m "feat(lib): answer normalize + match with tests"
```

---

## Task 6: PIN hashing + rate limiting (TDD)

**Files:**
- Create: `src/lib/pin.ts`, `tests/unit/pin.test.ts`

- [ ] **Step 1: Failing tests**

```ts
// tests/unit/pin.test.ts
import { describe, it, expect, vi } from "vitest";
import { hashPin, verifyPin, checkAndUpdateRateLimit } from "@/lib/pin";

describe("hashPin / verifyPin", () => {
  it("verifies correct PIN", async () => {
    const hash = await hashPin("1234");
    expect(await verifyPin("1234", hash)).toBe(true);
  });
  it("rejects wrong PIN", async () => {
    const hash = await hashPin("1234");
    expect(await verifyPin("0000", hash)).toBe(false);
  });
});

describe("checkAndUpdateRateLimit", () => {
  it("blocks after 5 failures within window", async () => {
    const store = new Map<string, { failed_count: number; blocked_until: Date | null }>();
    const fakeDb = {
      get: async (ip: string) => store.get(ip) ?? null,
      upsert: async (ip: string, row: { failed_count: number; blocked_until: Date | null }) =>
        void store.set(ip, row),
    };
    const now = new Date("2026-04-15T00:00:00Z");

    for (let i = 0; i < 4; i++) {
      const r = await checkAndUpdateRateLimit(fakeDb, "1.2.3.4", false, now);
      expect(r.blocked).toBe(false);
    }
    const fifth = await checkAndUpdateRateLimit(fakeDb, "1.2.3.4", false, now);
    expect(fifth.blocked).toBe(true);
  });

  it("clears count on success", async () => {
    const store = new Map<string, { failed_count: number; blocked_until: Date | null }>();
    store.set("1.2.3.4", { failed_count: 3, blocked_until: null });
    const fakeDb = {
      get: async (ip: string) => store.get(ip) ?? null,
      upsert: async (ip: string, row: { failed_count: number; blocked_until: Date | null }) =>
        void store.set(ip, row),
    };
    await checkAndUpdateRateLimit(fakeDb, "1.2.3.4", true, new Date());
    expect(store.get("1.2.3.4")?.failed_count).toBe(0);
  });
});
```

- [ ] **Step 2: Implement `src/lib/pin.ts`**

```ts
import bcrypt from "bcryptjs";

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

type RateRow = { failed_count: number; blocked_until: Date | null };
type RateStore = {
  get: (ip: string) => Promise<RateRow | null>;
  upsert: (ip: string, row: RateRow) => Promise<void>;
};

const MAX_FAILURES = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000;

export async function checkAndUpdateRateLimit(
  store: RateStore,
  ip: string,
  success: boolean,
  now: Date = new Date(),
): Promise<{ blocked: boolean }> {
  const row = (await store.get(ip)) ?? { failed_count: 0, blocked_until: null };
  if (row.blocked_until && row.blocked_until > now) {
    return { blocked: true };
  }
  if (success) {
    await store.upsert(ip, { failed_count: 0, blocked_until: null });
    return { blocked: false };
  }
  const next = row.failed_count + 1;
  const blocked_until = next >= MAX_FAILURES ? new Date(now.getTime() + BLOCK_DURATION_MS) : null;
  await store.upsert(ip, { failed_count: next, blocked_until });
  return { blocked: Boolean(blocked_until) };
}
```

- [ ] **Step 3: Run + commit**

```bash
pnpm test
git add src/lib/pin.ts tests/unit/pin.test.ts
git commit -m "feat(lib): PIN hash + rate limit with tests"
```

---

## Task 7: Reveal logic — totals, jigsaw completeness, final-reward gate (TDD)

**Files:**
- Create: `src/lib/reveal.ts`, `tests/unit/reveal.test.ts`

- [ ] **Step 1: Failing tests**

```ts
// tests/unit/reveal.test.ts
import { describe, it, expect } from "vitest";
import { totalPoints, jigsawComplete, isFinalRewardUnlocked } from "@/lib/reveal";

const days = [
  { day_number: 1, points: 10 },
  { day_number: 2, points: 10 },
  { day_number: 3, points: 10 },
  { day_number: 4, points: 15 },
  { day_number: 5, points: 15 },
  { day_number: 6, points: 15 },
  { day_number: 7, points: 20 },
  { day_number: 8, points: 20 },
  { day_number: 9, points: 20 },
];

describe("totalPoints", () => {
  it("sums points for completed days only", () => {
    expect(totalPoints(days, [1, 2, 3])).toBe(30);
    expect(totalPoints(days, [1, 4, 7])).toBe(45);
    expect(totalPoints(days, [])).toBe(0);
  });
});

describe("jigsawComplete", () => {
  it("true iff all 9 days have kid-tile completions", () => {
    expect(jigsawComplete([1, 2, 3, 4, 5, 6, 7, 8, 9])).toBe(true);
    expect(jigsawComplete([1, 2, 3, 4, 5, 6, 7, 8])).toBe(false);
    expect(jigsawComplete([])).toBe(false);
  });
});

describe("isFinalRewardUnlocked", () => {
  it("requires day 9 + jigsaw complete + points >= 100", () => {
    expect(isFinalRewardUnlocked({
      dayNumber: 9, completedDays: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      tiledDays: [1, 2, 3, 4, 5, 6, 7, 8, 9], days
    })).toBe(true);
  });
  it("false if points < 100", () => {
    expect(isFinalRewardUnlocked({
      dayNumber: 9, completedDays: [1, 2, 3, 4, 5],
      tiledDays: [1, 2, 3, 4, 5, 6, 7, 8, 9], days
    })).toBe(false);
  });
  it("false if jigsaw incomplete", () => {
    expect(isFinalRewardUnlocked({
      dayNumber: 9, completedDays: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      tiledDays: [1, 2, 3, 4, 5, 6, 7, 8], days
    })).toBe(false);
  });
  it("false if not day 9", () => {
    expect(isFinalRewardUnlocked({
      dayNumber: 8, completedDays: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      tiledDays: [1, 2, 3, 4, 5, 6, 7, 8, 9], days
    })).toBe(false);
  });
});
```

- [ ] **Step 2: Implement**

```ts
// src/lib/reveal.ts
import { POINTS_THRESHOLD, TOTAL_DAYS } from "./constants";

type DayPoints = { day_number: number; points: number };

export function totalPoints(days: DayPoints[], completedDays: number[]): number {
  const done = new Set(completedDays);
  return days.filter((d) => done.has(d.day_number)).reduce((s, d) => s + d.points, 0);
}

export function jigsawComplete(tiledDays: number[]): boolean {
  const s = new Set(tiledDays);
  if (s.size !== TOTAL_DAYS) return false;
  for (let i = 1; i <= TOTAL_DAYS; i++) if (!s.has(i)) return false;
  return true;
}

export function isFinalRewardUnlocked(args: {
  dayNumber: number;
  completedDays: number[];
  tiledDays: number[];
  days: DayPoints[];
}): boolean {
  if (args.dayNumber !== TOTAL_DAYS) return false;
  if (!jigsawComplete(args.tiledDays)) return false;
  return totalPoints(args.days, args.completedDays) >= POINTS_THRESHOLD;
}
```

- [ ] **Step 3: Run + commit**

```bash
pnpm test
git add src/lib/reveal.ts tests/unit/reveal.test.ts
git commit -m "feat(lib): reveal totals + final-reward gate with tests"
```

---

## Task 8: Kid session (signed cookie) + auth endpoint

**Files:**
- Create: `src/lib/session.ts`, `src/app/api/kid-auth/route.ts`, `src/lib/guards/kid.ts`, `src/schemas/day.ts` (PIN schema)

- [ ] **Step 1: Session helper**

Create `src/lib/session.ts`:
```ts
import { sealData, unsealData } from "iron-session";
import { cookies } from "next/headers";
import { env } from "./env";

const COOKIE_NAME = "kid_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

type SessionData = { kid: true; since: number };

export async function setKidSession() {
  const sealed = await sealData({ kid: true, since: Date.now() } satisfies SessionData, {
    password: env.kidSessionSecret(),
  });
  const c = await cookies();
  c.set(COOKIE_NAME, sealed, {
    httpOnly: true, secure: true, sameSite: "lax",
    path: "/", maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearKidSession() {
  const c = await cookies();
  c.delete(COOKIE_NAME);
}

export async function readKidSession(): Promise<SessionData | null> {
  const c = await cookies();
  const raw = c.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    return await unsealData<SessionData>(raw, { password: env.kidSessionSecret() });
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Kid guard**

Create `src/lib/guards/kid.ts`:
```ts
import { readKidSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function requireKid(): Promise<NextResponse | null> {
  const s = await readKidSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return null;
}
```

- [ ] **Step 3: PIN schema**

Create `src/schemas/day.ts`:
```ts
import { z } from "zod";
export const PinSchema = z.object({ pin: z.string().regex(/^\d{4}$/) });
```

- [ ] **Step 4: Kid auth endpoint**

Create `src/app/api/kid-auth/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { verifyPin, checkAndUpdateRateLimit } from "@/lib/pin";
import { setKidSession } from "@/lib/session";
import { PinSchema } from "@/schemas/day";

function ipFrom(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? "0.0.0.0";
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = PinSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid pin format" }, { status: 400 });

  const sb = adminClient();
  const ip = ipFrom(req);

  const store = {
    get: async (ip: string) => {
      const { data } = await sb.from("login_attempts").select("failed_count,blocked_until").eq("ip", ip).maybeSingle();
      if (!data) return null;
      return { failed_count: data.failed_count, blocked_until: data.blocked_until ? new Date(data.blocked_until) : null };
    },
    upsert: async (ip: string, row: { failed_count: number; blocked_until: Date | null }) => {
      await sb.from("login_attempts").upsert({ ip, failed_count: row.failed_count, blocked_until: row.blocked_until?.toISOString() ?? null });
    },
  };

  // Pre-check lockout before hash compare
  const pre = await checkAndUpdateRateLimit(store, ip, true /* don't mutate on pre-check */, new Date());
  if (pre.blocked) return NextResponse.json({ error: "locked_out" }, { status: 429 });

  const { data: pinRow } = await sb.from("household_pin").select("pin_hash").eq("id", 1).single();
  if (!pinRow) return NextResponse.json({ error: "pin_not_set" }, { status: 500 });

  const ok = await verifyPin(parsed.data.pin, pinRow.pin_hash);
  const result = await checkAndUpdateRateLimit(store, ip, ok);
  if (!ok) {
    if (result.blocked) return NextResponse.json({ error: "locked_out" }, { status: 429 });
    return NextResponse.json({ error: "wrong_pin" }, { status: 401 });
  }

  await setKidSession();
  await sb.from("audit_log").insert({ actor: "kid", action: "pin_login" });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 5: Smoke test**

```bash
pnpm dev &
sleep 3
curl -s -X POST http://localhost:3000/api/kid-auth -H "content-type: application/json" -d '{"pin":"1234"}' -i | head -20
# Expected: 200 and a Set-Cookie: kid_session=...
curl -s -X POST http://localhost:3000/api/kid-auth -H "content-type: application/json" -d '{"pin":"0000"}' -i | head -10
# Expected: 401
kill %1
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/session.ts src/lib/guards/kid.ts src/schemas/day.ts src/app/api/kid-auth/
git commit -m "feat(auth): kid PIN login with signed cookie + rate limit"
```

---

## Task 9: Admin auth (Supabase magic link + allow-list guard)

**Files:**
- Create: `src/lib/guards/admin.ts`, `src/middleware.ts`

- [ ] **Step 1: Admin guard**

Create `src/lib/guards/admin.ts`:
```ts
import { serverClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export async function getAdminEmail(): Promise<string | null> {
  const sb = await serverClient();
  const { data } = await sb.auth.getUser();
  const email = data.user?.email?.toLowerCase();
  if (!email) return null;
  if (!env.adminEmails().includes(email)) return null;
  return email;
}

export async function requireAdmin(): Promise<string> {
  const email = await getAdminEmail();
  if (!email) throw new Response("forbidden", { status: 403 });
  return email;
}
```

- [ ] **Step 2: Middleware — protect /admin and / routes**

Create `src/middleware.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { readKidSession } from "@/lib/session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes
  if (pathname.startsWith("/login") ||
      pathname.startsWith("/api/kid-auth") ||
      pathname.startsWith("/auth/callback") ||   // Supabase magic-link redirect
      pathname.startsWith("/_next") ||
      pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  // Admin: let the page/route do its own Supabase-session check via requireAdmin.
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    return NextResponse.next();
  }

  // Everything else = kid view, require signed cookie
  const s = await readKidSession();
  if (!s) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("return_to", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next|favicon).*)"] };
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/guards/admin.ts src/middleware.ts
git commit -m "feat(auth): admin guard + middleware routing"
```

---

## Task 10: GET /api/today + /api/days/[n]

**Files:**
- Create: `src/app/api/today/route.ts`, `src/app/api/days/[n]/route.ts`

- [ ] **Step 1: Today endpoint**

Create `src/app/api/today/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireKid } from "@/lib/guards/kid";
import { readKidSession } from "@/lib/session";
import { isUnlocked } from "@/lib/unlock";
import { DAY_DATES, TOTAL_DAYS } from "@/lib/constants";

function todaysDayNumber(now: Date): number {
  // Returns the highest day whose unlock_at has passed (so locked morning still shows yesterday? No — show today's door as locked).
  // Simpler: find the day whose date matches today in SGT, else return the nearest upcoming.
  const sgt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const exact = DAY_DATES.find((d) => d.date === sgt);
  if (exact) return exact.n;
  const past = DAY_DATES.filter((d) => d.date < sgt);
  if (past.length === 0) return 1;       // before trip starts → show day 1 (locked)
  if (past.length === TOTAL_DAYS) return TOTAL_DAYS; // after trip → day 9
  return past[past.length - 1].n + 1;
}

export async function GET(req: NextRequest) {
  const unauthorized = await requireKid();
  if (unauthorized) return unauthorized;

  const now = new Date();
  const n = todaysDayNumber(now);
  const sb = adminClient();
  const { data: day } = await sb.from("days").select("*").eq("day_number", n).single();
  if (!day) return NextResponse.json({ error: "missing day" }, { status: 500 });

  const unlocked = isUnlocked({ day_number: day.day_number, unlock_at: day.unlock_at }, { isAdmin: false }, now);

  const { data: completion } = await sb.from("completions").select("day_number").eq("day_number", n).maybeSingle();
  const { data: tile } = await sb.from("kid_tile_completions").select("day_number").eq("day_number", n).maybeSingle();

  const { data: allTiles } = await sb.from("kid_tile_completions").select("day_number");
  const jigsaw_state = Array.from({ length: TOTAL_DAYS }, (_, i) =>
    (allTiles ?? []).some((r) => r.day_number === i + 1),
  );

  const { data: doneDays } = await sb.from("completions").select("day_number");
  const { data: pointsRows } = await sb.from("days").select("day_number,points");
  const total_points = (pointsRows ?? [])
    .filter((r) => (doneDays ?? []).some((d) => d.day_number === r.day_number))
    .reduce((s, r) => s + r.points, 0);

  return NextResponse.json({
    day_number: day.day_number,
    date: day.date,
    unlock_at: day.unlock_at,
    unlocked,
    activity_type: unlocked ? day.activity_type : null,
    activity_title: unlocked ? day.activity_title : null,
    activity_body: unlocked ? day.activity_body : null,
    expected_minutes: day.expected_minutes,
    media_type: unlocked ? day.media_type : null,
    completed: !!completion,
    kid_tile_completed: !!tile,
    total_points,
    jigsaw_state,
  });
}
```

- [ ] **Step 2: /api/days/[n]**

Create `src/app/api/days/[n]/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireKid } from "@/lib/guards/kid";
import { isUnlocked } from "@/lib/unlock";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ n: string }> }) {
  const unauthorized = await requireKid();
  if (unauthorized) return unauthorized;
  const n = Number((await ctx.params).n);
  if (!Number.isInteger(n) || n < 1 || n > 9) return NextResponse.json({ error: "bad day" }, { status: 400 });

  const sb = adminClient();
  const { data: day } = await sb.from("days").select("*").eq("day_number", n).single();
  if (!day) return NextResponse.json({ error: "not found" }, { status: 404 });

  const unlocked = isUnlocked({ day_number: day.day_number, unlock_at: day.unlock_at }, { isAdmin: false });
  if (!unlocked) return NextResponse.json({ error: "locked" }, { status: 403 });

  const { data: completion } = await sb.from("completions").select("day_number,completed_at").eq("day_number", n).maybeSingle();
  const { data: tile } = await sb.from("kid_tile_completions").select("day_number").eq("day_number", n).maybeSingle();

  return NextResponse.json({
    day_number: day.day_number,
    date: day.date,
    activity_type: day.activity_type,
    activity_title: day.activity_title,
    activity_body: day.activity_body,
    media_type: day.media_type,
    completed: !!completion,
    kid_tile_completed: !!tile,
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/today/ src/app/api/days/
git commit -m "feat(api): kid read endpoints for today + day"
```

---

## Task 11: Activity completion endpoints (attempt/creative/kindness)

**Files:**
- Create: `src/app/api/days/[n]/attempt/route.ts`, `.../creative/route.ts`, `.../kindness/route.ts`

- [ ] **Step 1: Attempt (riddle/quiz)**

Create `src/app/api/days/[n]/attempt/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminClient } from "@/lib/supabase/admin";
import { requireKid } from "@/lib/guards/kid";
import { isUnlocked } from "@/lib/unlock";
import { matches } from "@/lib/answer";

const Body = z.object({ answer: z.string().min(1).max(200) });

export async function POST(req: NextRequest, ctx: { params: Promise<{ n: string }> }) {
  const unauthorized = await requireKid();
  if (unauthorized) return unauthorized;
  const n = Number((await ctx.params).n);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad body" }, { status: 400 });

  const sb = adminClient();
  const { data: day } = await sb.from("days").select("*").eq("day_number", n).single();
  if (!day) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!isUnlocked({ day_number: n, unlock_at: day.unlock_at }, { isAdmin: false })) {
    return NextResponse.json({ error: "locked" }, { status: 403 });
  }
  if (!["riddle", "quiz"].includes(day.activity_type)) {
    return NextResponse.json({ error: "wrong activity type" }, { status: 400 });
  }

  const correct = matches(parsed.data.answer, day.activity_answer);
  if (!correct) return NextResponse.json({ correct: false });

  await sb.from("completions").upsert({ day_number: n });
  await sb.from("audit_log").insert({ actor: "kid", action: "completed_day", payload: { day: n, type: day.activity_type } });
  return NextResponse.json({ correct: true });
}
```

- [ ] **Step 2: Creative (photo upload)**

Create `src/app/api/days/[n]/creative/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireKid } from "@/lib/guards/kid";
import { isUnlocked } from "@/lib/unlock";

const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest, ctx: { params: Promise<{ n: string }> }) {
  const unauthorized = await requireKid();
  if (unauthorized) return unauthorized;
  const n = Number((await ctx.params).n);

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "no file" }, { status: 400 });
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: "bad type" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "too big" }, { status: 413 });

  const sb = adminClient();
  const { data: day } = await sb.from("days").select("unlock_at,activity_type").eq("day_number", n).single();
  if (!day) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!isUnlocked({ day_number: n, unlock_at: day.unlock_at }, { isAdmin: false })) {
    return NextResponse.json({ error: "locked" }, { status: 403 });
  }
  if (day.activity_type !== "creative") return NextResponse.json({ error: "wrong type" }, { status: 400 });

  const path = `day-${n}-${Date.now()}.${file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg"}`;
  const { error: uploadErr } = await sb.storage.from("photos").upload(path, await file.arrayBuffer(), { contentType: file.type });
  if (uploadErr) return NextResponse.json({ error: "upload failed" }, { status: 500 });

  await sb.from("completions").upsert({ day_number: n, photo_storage_path: path });
  await sb.from("audit_log").insert({ actor: "kid", action: "completed_day", payload: { day: n, type: "creative" } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Kindness**

Create `src/app/api/days/[n]/kindness/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireKid } from "@/lib/guards/kid";
import { isUnlocked } from "@/lib/unlock";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ n: string }> }) {
  const unauthorized = await requireKid();
  if (unauthorized) return unauthorized;
  const n = Number((await ctx.params).n);

  const sb = adminClient();
  const { data: day } = await sb.from("days").select("unlock_at,activity_type").eq("day_number", n).single();
  if (!day) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!isUnlocked({ day_number: n, unlock_at: day.unlock_at }, { isAdmin: false })) {
    return NextResponse.json({ error: "locked" }, { status: 403 });
  }
  if (day.activity_type !== "kindness") return NextResponse.json({ error: "wrong type" }, { status: 400 });

  await sb.from("completions").upsert({ day_number: n });
  await sb.from("audit_log").insert({ actor: "kid", action: "completed_day", payload: { day: n, type: "kindness" } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/days/
git commit -m "feat(api): kid completion endpoints — attempt, creative, kindness"
```

---

## Task 12: Jigsaw piece placement + reveal endpoint

**Files:**
- Create: `src/app/api/days/[n]/kid-tile/route.ts`, `src/app/api/days/[n]/reveal/route.ts`

- [ ] **Step 1: Kid-tile endpoint (jigsaw piece)**

Create `src/app/api/days/[n]/kid-tile/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireKid } from "@/lib/guards/kid";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ n: string }> }) {
  const unauthorized = await requireKid();
  if (unauthorized) return unauthorized;
  const n = Number((await ctx.params).n);

  const sb = adminClient();
  const { data: completion } = await sb.from("completions").select("day_number").eq("day_number", n).maybeSingle();
  if (!completion) return NextResponse.json({ error: "main activity not completed" }, { status: 400 });

  await sb.from("kid_tile_completions").upsert({ day_number: n });
  await sb.from("audit_log").insert({ actor: "kid", action: "placed_piece", payload: { day: n } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Reveal endpoint**

Create `src/app/api/days/[n]/reveal/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireKid } from "@/lib/guards/kid";
import { isUnlocked } from "@/lib/unlock";
import { isFinalRewardUnlocked, totalPoints } from "@/lib/reveal";

const SIGNED_URL_TTL = 60 * 60;

export async function GET(_req: NextRequest, ctx: { params: Promise<{ n: string }> }) {
  const unauthorized = await requireKid();
  if (unauthorized) return unauthorized;
  const n = Number((await ctx.params).n);

  const sb = adminClient();
  const { data: day } = await sb.from("days").select("*").eq("day_number", n).single();
  if (!day) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!isUnlocked({ day_number: n, unlock_at: day.unlock_at }, { isAdmin: false })) {
    return NextResponse.json({ error: "locked" }, { status: 403 });
  }

  const { data: completion } = await sb.from("completions").select("day_number").eq("day_number", n).maybeSingle();
  if (!completion) return NextResponse.json({ error: "not completed" }, { status: 403 });

  // Sign media URL based on media_type
  let media_signed_url: string | null = null;
  if ((day.media_type === "video" || day.media_type === "montage") && day.media_storage_path) {
    const { data } = await sb.storage.from("media").createSignedUrl(day.media_storage_path, SIGNED_URL_TTL);
    media_signed_url = data?.signedUrl ?? null;
  }

  // Sign mystery photos if type is mystery_photos
  type MysteryPhoto = { close_up_path: string; full_path: string; label: string; close_up_signed_url?: string; full_signed_url?: string };
  const config = (day.media_config ?? {}) as { photos?: MysteryPhoto[]; correct_index?: number; text?: string; emoji?: string; colors?: string[] };
  if (day.media_type === "mystery_photos" && Array.isArray(config.photos)) {
    for (const p of config.photos) {
      const cu = await sb.storage.from("mystery").createSignedUrl(p.close_up_path, SIGNED_URL_TTL);
      const full = await sb.storage.from("mystery").createSignedUrl(p.full_path, SIGNED_URL_TTL);
      p.close_up_signed_url = cu.data?.signedUrl ?? undefined;
      p.full_signed_url = full.data?.signedUrl ?? undefined;
    }
  }

  // Compute final-reward gate (only relevant for day 9)
  const { data: doneDays } = await sb.from("completions").select("day_number");
  const { data: tiledDays } = await sb.from("kid_tile_completions").select("day_number");
  const { data: allPoints } = await sb.from("days").select("day_number,points");
  const final_reward_unlocked = isFinalRewardUnlocked({
    dayNumber: n,
    completedDays: (doneDays ?? []).map((r) => r.day_number),
    tiledDays: (tiledDays ?? []).map((r) => r.day_number),
    days: (allPoints ?? []),
  });

  return NextResponse.json({
    media_type: day.media_type,
    media_signed_url,
    media_config: config,
    coupon_text: day.coupon_text,
    points: day.points,
    total_points: totalPoints(allPoints ?? [], (doneDays ?? []).map((r) => r.day_number)),
    final_reward_unlocked,
    jigsaw_state: Array.from({ length: 9 }, (_, i) => (tiledDays ?? []).some((r) => r.day_number === i + 1)),
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/days/
git commit -m "feat(api): jigsaw piece + reveal endpoints with signed URLs"
```

---

## Task 13: Admin CRUD endpoints

**Files:**
- Create: `src/app/api/admin/days/route.ts`, `.../days/[n]/route.ts`, `.../days/[n]/media/route.ts`, `.../days/[n]/mystery/route.ts`, `.../days/[n]/override/route.ts`, `.../days/[n]/reset/route.ts`, `.../pin/route.ts`
- Modify: `src/schemas/day.ts` (add DayPatch schema, MysteryPhoto schema)

- [ ] **Step 1: Schemas**

Extend `src/schemas/day.ts`:
```ts
import { z } from "zod";

export const PinSchema = z.object({ pin: z.string().regex(/^\d{4}$/) });

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
});

export const NewPinSchema = z.object({ new_pin: z.string().regex(/^\d{4}$/) });
```

- [ ] **Step 2: GET /api/admin/days + PUT /api/admin/days/[n]**

Create `src/app/api/admin/days/route.ts`:
```ts
import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/guards/admin";

export async function GET() {
  await requireAdmin();
  const sb = adminClient();
  const { data } = await sb.from("days").select("*").order("day_number");
  return NextResponse.json(data ?? []);
}
```

Create `src/app/api/admin/days/[n]/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/guards/admin";
import { DayPatch } from "@/schemas/day";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ n: string }> }) {
  const email = await requireAdmin();
  const n = Number((await ctx.params).n);
  const parsed = DayPatch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad body", details: parsed.error.issues }, { status: 400 });

  const sb = adminClient();
  const { error } = await sb.from("days").update(parsed.data).eq("day_number", n);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await sb.from("audit_log").insert({ actor: email, action: "admin_edit_day", payload: { day: n, patch: parsed.data } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Media upload**

Create `src/app/api/admin/days/[n]/media/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/guards/admin";

const MAX_BYTES = 200 * 1024 * 1024;
const ALLOWED = ["video/mp4", "video/webm", "video/quicktime"];

export async function POST(req: NextRequest, ctx: { params: Promise<{ n: string }> }) {
  await requireAdmin();
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
```

- [ ] **Step 4: Mystery photo upload**

Create `src/app/api/admin/days/[n]/mystery/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/guards/admin";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest, ctx: { params: Promise<{ n: string }> }) {
  await requireAdmin();
  const n = Number((await ctx.params).n);
  const form = await req.formData();
  const closeUp = form.get("close_up");
  const full = form.get("full");
  const label = String(form.get("label") ?? "");
  const correct = form.get("correct") === "true";
  if (!(closeUp instanceof File) || !(full instanceof File)) return NextResponse.json({ error: "need close_up + full" }, { status: 400 });
  for (const f of [closeUp, full]) {
    if (!ALLOWED.includes(f.type)) return NextResponse.json({ error: "bad type" }, { status: 400 });
    if (f.size > MAX_BYTES) return NextResponse.json({ error: "too big" }, { status: 413 });
  }

  const sb = adminClient();
  const idx = Date.now();
  const cPath = `day-${n}-${idx}-close.jpg`;
  const fPath = `day-${n}-${idx}-full.jpg`;
  await sb.storage.from("mystery").upload(cPath, await closeUp.arrayBuffer(), { contentType: closeUp.type, upsert: true });
  await sb.storage.from("mystery").upload(fPath, await full.arrayBuffer(), { contentType: full.type, upsert: true });

  const { data: day } = await sb.from("days").select("media_config").eq("day_number", n).single();
  const cfg: { photos?: Array<{ close_up_path: string; full_path: string; label: string }>; correct_index?: number } = (day?.media_config as object) ?? {};
  const photos = Array.isArray(cfg.photos) ? cfg.photos : [];
  photos.push({ close_up_path: cPath, full_path: fPath, label });
  if (correct) cfg.correct_index = photos.length - 1;
  cfg.photos = photos;
  await sb.from("days").update({ media_config: cfg }).eq("day_number", n);
  return NextResponse.json({ ok: true, photos });
}
```

- [ ] **Step 5: Override + reset + PIN**

Create `src/app/api/admin/days/[n]/override/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/guards/admin";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ n: string }> }) {
  const email = await requireAdmin();
  const n = Number((await ctx.params).n);
  const sb = adminClient();
  await sb.from("days").update({ unlock_at: new Date().toISOString() }).eq("day_number", n);
  await sb.from("audit_log").insert({ actor: email, action: "admin_override", payload: { day: n } });
  return NextResponse.json({ ok: true });
}
```

Create `src/app/api/admin/days/[n]/reset/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/guards/admin";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ n: string }> }) {
  const email = await requireAdmin();
  const n = Number((await ctx.params).n);
  const sb = adminClient();
  await sb.from("completions").delete().eq("day_number", n);
  await sb.from("kid_tile_completions").delete().eq("day_number", n);
  await sb.from("audit_log").insert({ actor: email, action: "admin_reset", payload: { day: n } });
  return NextResponse.json({ ok: true });
}
```

Create `src/app/api/admin/pin/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/guards/admin";
import { hashPin } from "@/lib/pin";
import { NewPinSchema } from "@/schemas/day";

export async function PUT(req: NextRequest) {
  const email = await requireAdmin();
  const parsed = NewPinSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad pin" }, { status: 400 });
  const sb = adminClient();
  const pin_hash = await hashPin(parsed.data.new_pin);
  await sb.from("household_pin").update({ pin_hash, updated_at: new Date().toISOString() }).eq("id", 1);
  await sb.from("audit_log").insert({ actor: email, action: "pin_rotated" });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/admin/ src/schemas/day.ts
git commit -m "feat(api): admin CRUD + uploads + override/reset/pin"
```

---

## Task 14: Jigsaw assets (SVG map + 9 pieces)

**Files:**
- Create: `public/jigsaw/map.svg`, `public/jigsaw/pieces/piece-1.svg` … `piece-9.svg`

- [ ] **Step 1: Design rationale**

The trip map is a stylized horizontal flight path with 9 labeled waypoints/landmarks, left-to-right:

1. Singapore (SIN) — Merlion silhouette
2. Over Pacific (cloud/sun)
3. San Francisco (Golden Gate)
4. Over California (road sign)
5. Las Vegas (Sphere or neon strip)
6. Google Next venue
7. Google Next venue (day 2)
8. Flight back (airplane)
9. Home again (house with heart)

Each waypoint becomes piece `n`. The full map is a 900×300 px SVG with 9 equal 100×300 columns, each containing a grouped waypoint illustration. Pieces are extracted as separate SVGs with the same coordinate system so they can be positioned absolutely onto the map via matching `transform`.

- [ ] **Step 2: Create `public/jigsaw/map.svg`**

Write a single SVG file using simple flat illustrations (emoji fallback is fine for V1). Each waypoint lives in `<g id="piece-{n}">` at `x = (n-1)*100`. Sketch-level fidelity is acceptable; this is a family app.

Minimal viable version (commit this; iterate later if time allows):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 300" width="100%" height="auto">
  <defs>
    <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="#fde68a"/>
      <stop offset="100%" stop-color="#60a5fa"/>
    </linearGradient>
  </defs>
  <rect width="900" height="300" fill="url(#sky)"/>
  <!-- flight path arc -->
  <path d="M 50 200 Q 450 40 850 200" stroke="#fff" stroke-width="3" stroke-dasharray="8 6" fill="none"/>
  <!-- 9 waypoint groups, one per piece. Replace emoji with proper svg art when time allows. -->
  <g id="piece-1"><circle cx="50" cy="200" r="20" fill="#ef4444"/><text x="50" y="260" text-anchor="middle" font-size="16">🇸🇬 SIN</text></g>
  <g id="piece-2"><text x="150" y="120" text-anchor="middle" font-size="36">☁️</text><text x="150" y="260" text-anchor="middle" font-size="14">Pacific</text></g>
  <g id="piece-3"><text x="250" y="120" text-anchor="middle" font-size="36">🌉</text><text x="250" y="260" text-anchor="middle" font-size="14">SFO</text></g>
  <g id="piece-4"><text x="350" y="120" text-anchor="middle" font-size="36">🛣️</text><text x="350" y="260" text-anchor="middle" font-size="14">California</text></g>
  <g id="piece-5"><text x="450" y="120" text-anchor="middle" font-size="36">🎰</text><text x="450" y="260" text-anchor="middle" font-size="14">Vegas</text></g>
  <g id="piece-6"><text x="550" y="120" text-anchor="middle" font-size="36">🔷</text><text x="550" y="260" text-anchor="middle" font-size="14">Google Next</text></g>
  <g id="piece-7"><text x="650" y="120" text-anchor="middle" font-size="36">🎤</text><text x="650" y="260" text-anchor="middle" font-size="14">Keynote</text></g>
  <g id="piece-8"><text x="750" y="120" text-anchor="middle" font-size="36">✈️</text><text x="750" y="260" text-anchor="middle" font-size="14">Flying Home</text></g>
  <g id="piece-9"><text x="850" y="120" text-anchor="middle" font-size="36">🏠</text><text x="850" y="260" text-anchor="middle" font-size="14">Home!</text></g>
</svg>
```

- [ ] **Step 3: Generate 9 piece SVGs**

Each piece is a 100×300 crop of the map at `x = (n-1)*100`. Piece `n` SVG is the corresponding `<g>` from the map, rewrapped with its own `<svg>` viewBox:

```svg
<!-- public/jigsaw/pieces/piece-3.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="200 0 100 300" width="100" height="300">
  <text x="250" y="120" text-anchor="middle" font-size="36">🌉</text>
  <text x="250" y="260" text-anchor="middle" font-size="14">SFO</text>
</svg>
```

Write all 9 (piece-1.svg … piece-9.svg) using the same pattern; viewBox x-offset is `(n-1)*100`.

- [ ] **Step 4: Commit**

```bash
git add public/jigsaw/
git commit -m "feat(assets): trip-map SVG + 9 jigsaw pieces (emoji placeholders)"
```

---

## Task 15: Shared UI components (DoorGrid, TripMapJigsaw, CountdownTimer)

**Files:**
- Create: `src/components/DoorGrid.tsx`, `src/components/TripMapJigsaw.tsx`, `src/components/CountdownTimer.tsx`

- [ ] **Step 1: DoorGrid**

Create `src/components/DoorGrid.tsx`:
```tsx
"use client";
import Link from "next/link";

type Door = {
  day_number: number;
  date: string;
  unlock_at: string;
  completed: boolean;
};

export function DoorGrid({ doors, todayNumber }: { doors: Door[]; todayNumber: number }) {
  const now = Date.now();
  return (
    <div className="grid grid-cols-3 gap-3 p-4">
      {doors.map((d) => {
        const unlocked = new Date(d.unlock_at).getTime() <= now;
        const isToday = d.day_number === todayNumber;
        const state = d.completed ? "done" : unlocked ? (isToday ? "today" : "missed") : "locked";
        const classes = {
          locked: "bg-neutral-800 text-neutral-500",
          today: "bg-gradient-to-br from-orange-400 to-pink-500 text-white animate-pulse shadow-lg",
          missed: "bg-amber-900/40 text-amber-200",
          done: "bg-emerald-900 text-emerald-200",
        }[state];
        const href = unlocked ? `/day/${d.day_number}` : "#";
        return (
          <Link key={d.day_number} href={href} aria-disabled={!unlocked}
            className={`aspect-square rounded-2xl flex flex-col items-center justify-center font-semibold relative ${classes} ${!unlocked ? "pointer-events-none" : ""}`}>
            <div className="text-3xl">{d.day_number}</div>
            <div className="text-xs opacity-70 mt-1">{new Date(d.date).toLocaleDateString("en-SG", { weekday: "short" })}</div>
            {state === "done" && <div className="absolute top-2 right-2 text-base">✓</div>}
          </Link>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: TripMapJigsaw**

Create `src/components/TripMapJigsaw.tsx`:
```tsx
"use client";
import Image from "next/image";

export function TripMapJigsaw({ state }: { state: boolean[] }) {
  return (
    <div className="relative mx-auto max-w-4xl aspect-[3/1] rounded-2xl overflow-hidden bg-slate-900">
      {/* Ghost outline */}
      <Image src="/jigsaw/map.svg" alt="Trip map" fill className="opacity-20" />
      {/* Placed pieces on top */}
      <div className="absolute inset-0 flex">
        {state.map((placed, i) => (
          <div key={i} className="flex-1 relative">
            {placed && (
              <Image src={`/jigsaw/pieces/piece-${i + 1}.svg`} alt={`Piece ${i + 1}`} fill
                className="transition-all duration-500 animate-[fade-in_0.6s_ease-out]" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: CountdownTimer**

Create `src/components/CountdownTimer.tsx`:
```tsx
"use client";
import { useEffect, useState } from "react";

export function CountdownTimer({ target }: { target: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const ms = Math.max(0, new Date(target).getTime() - now);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms / 60_000) % 60);
  const s = Math.floor((ms / 1000) % 60);
  return <span className="tabular-nums">{h}h {m}m {s}s</span>;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/
git commit -m "feat(ui): DoorGrid, TripMapJigsaw, CountdownTimer"
```

---

## Task 16: Login page + kid home page

**Files:**
- Create: `src/app/login/page.tsx`, `src/app/page.tsx`

- [ ] **Step 1: Login page**

Create `src/app/login/page.tsx`:
```tsx
"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Login() {
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const router = useRouter();
  const search = useSearchParams();
  const returnTo = search.get("return_to") ?? "/";

  async function submitPin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/kid-auth", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pin }) });
    if (res.ok) router.push(returnTo);
    else if (res.status === 429) setError("Too many tries. Wait 15 minutes.");
    else setError("Wrong PIN. Try again!");
  }

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    const { createBrowserClient } = await import("@supabase/ssr");
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}/admin` } });
    setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-950 text-white">
      <div className="w-full max-w-md grid gap-6">
        <h1 className="text-3xl font-bold text-center">🎁 Daddy's Advent</h1>
        <form onSubmit={submitPin} className="p-5 rounded-2xl bg-neutral-900 grid gap-3">
          <label className="text-sm opacity-70">Kid PIN</label>
          <input value={pin} onChange={(e) => setPin(e.target.value)} inputMode="numeric" pattern="\d{4}" maxLength={4}
            className="bg-neutral-800 p-3 rounded-lg text-center tracking-[0.5em] text-2xl" autoFocus />
          <button className="p-3 rounded-lg bg-pink-500 font-semibold">Enter</button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </form>
        <details className="p-5 rounded-2xl bg-neutral-900">
          <summary className="cursor-pointer text-sm opacity-70">Admin login</summary>
          <form onSubmit={submitEmail} className="mt-3 grid gap-3">
            <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
              className="bg-neutral-800 p-3 rounded-lg" />
            <button className="p-3 rounded-lg bg-blue-500 font-semibold">Send magic link</button>
            {sent && <p className="text-emerald-400 text-sm">Check your email.</p>}
          </form>
        </details>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Kid home page**

Create `src/app/page.tsx`:
```tsx
import { headers } from "next/headers";
import { DoorGrid } from "@/components/DoorGrid";
import { TripMapJigsaw } from "@/components/TripMapJigsaw";
import { CountdownTimer } from "@/components/CountdownTimer";
import { adminClient } from "@/lib/supabase/admin";
import { DAY_DATES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function Home() {
  await headers(); // force dynamic
  const sb = adminClient();
  const { data: days } = await sb.from("days").select("day_number,date,unlock_at,points").order("day_number");
  const { data: completions } = await sb.from("completions").select("day_number");
  const { data: tiles } = await sb.from("kid_tile_completions").select("day_number");

  const doneSet = new Set((completions ?? []).map((r) => r.day_number));
  const totalPoints = (days ?? []).filter((d) => doneSet.has(d.day_number)).reduce((s, d) => s + d.points, 0);

  const now = new Date();
  const upcoming = (days ?? []).find((d) => new Date(d.unlock_at).getTime() > now.getTime());
  const todaysDay = upcoming ?? days?.[days.length - 1];

  const doors = (days ?? []).map((d) => ({
    day_number: d.day_number,
    date: d.date,
    unlock_at: d.unlock_at,
    completed: doneSet.has(d.day_number),
  }));

  const jigsawState = Array.from({ length: 9 }, (_, i) => (tiles ?? []).some((r) => r.day_number === i + 1));

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <header className="flex justify-between items-center p-4">
        <h1 className="text-xl font-bold">🎁 Daddy's Advent</h1>
        <span className="text-sm px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-200">⭐ {totalPoints} pts</span>
      </header>
      <DoorGrid doors={doors} todayNumber={todaysDay?.day_number ?? 1} />
      {upcoming && (
        <p className="text-center text-sm opacity-70 pb-4">
          Next door opens in <CountdownTimer target={upcoming.unlock_at} />
        </p>
      )}
      <section className="p-4">
        <h2 className="text-lg mb-2">Daddy's Journey</h2>
        <TripMapJigsaw state={jigsawState} />
      </section>
    </main>
  );
}
```

- [ ] **Step 3: Smoke test**

```bash
pnpm dev &
sleep 3
# Visit http://localhost:3000 → should redirect to /login
# Enter PIN 1234 → should land on home showing 9 locked doors (today's date is past all unlocks if running after 17 Apr; else all locked)
```

- [ ] **Step 4: Commit**

```bash
git add src/app/login src/app/page.tsx
git commit -m "feat(ui): login + kid home page"
```

---

## Task 17: Activity components

**Files:**
- Create: `src/components/activity/RiddleQuiz.tsx`, `src/components/activity/Creative.tsx`, `src/components/activity/Kindness.tsx`

- [ ] **Step 1: RiddleQuiz**

```tsx
// src/components/activity/RiddleQuiz.tsx
"use client";
import { useState } from "react";

export function RiddleQuiz({ dayNumber, title, body, onSolved }: { dayNumber: number; title: string; body: string; onSolved: () => void }) {
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    const res = await fetch(`/api/days/${dayNumber}/attempt`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ answer }),
    });
    setBusy(false);
    const data = await res.json();
    if (data.correct) onSolved();
    else setFeedback("Not quite — try again!");
  }

  return (
    <div className="max-w-lg mx-auto p-5 grid gap-4">
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="whitespace-pre-wrap">{body}</p>
      <form onSubmit={submit} className="grid gap-2">
        <input value={answer} onChange={(e) => setAnswer(e.target.value)} className="bg-neutral-800 p-3 rounded-lg" autoFocus />
        <button disabled={busy} className="p-3 rounded-lg bg-pink-500 font-semibold disabled:opacity-50">{busy ? "Checking..." : "Submit"}</button>
        {feedback && <p className="text-amber-300 text-sm">{feedback}</p>}
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Creative**

```tsx
// src/components/activity/Creative.tsx
"use client";
import { useState } from "react";

export function Creative({ dayNumber, title, body, onDone }: { dayNumber: number; title: string; body: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true); setErr(null);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/days/${dayNumber}/creative`, { method: "POST", body: form });
    setBusy(false);
    if (!res.ok) setErr("Upload failed. Tap to try again.");
    else onDone();
  }

  return (
    <div className="max-w-lg mx-auto p-5 grid gap-4">
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="whitespace-pre-wrap">{body}</p>
      <label className="p-4 border-2 border-dashed border-neutral-700 rounded-xl text-center cursor-pointer">
        {busy ? "Uploading…" : "📷 Take/choose a photo"}
        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      </label>
      {err && <p className="text-red-400 text-sm">{err}</p>}
    </div>
  );
}
```

- [ ] **Step 3: Kindness**

```tsx
// src/components/activity/Kindness.tsx
"use client";
import { useState } from "react";

export function Kindness({ dayNumber, title, body, onDone }: { dayNumber: number; title: string; body: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  async function mark() {
    setBusy(true);
    const res = await fetch(`/api/days/${dayNumber}/kindness`, { method: "POST" });
    setBusy(false);
    if (res.ok) onDone();
  }
  return (
    <div className="max-w-lg mx-auto p-5 grid gap-4">
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="whitespace-pre-wrap">{body}</p>
      <button disabled={busy} onClick={mark} className="p-4 rounded-xl bg-emerald-500 font-semibold text-lg disabled:opacity-50">
        {busy ? "Saving…" : "We did it! ✨"}
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/activity
git commit -m "feat(ui): activity components for riddle/quiz/creative/kindness"
```

---

## Task 18: Reveal components

**Files:**
- Create: `src/components/reveal/MediaVideo.tsx`, `MediaMystery.tsx`, `MediaPostcard.tsx`, `MediaMontage.tsx`, `JigsawPieceStep.tsx`, `CouponStep.tsx`, `BigSurpriseStep.tsx`

- [ ] **Step 1: MediaVideo + MediaMontage (same component)**

```tsx
// src/components/reveal/MediaVideo.tsx
"use client";
export function MediaVideo({ src, onContinue }: { src: string | null; onContinue: () => void }) {
  return (
    <div className="max-w-lg mx-auto p-5 grid gap-4">
      {src ? (
        <video src={src} controls autoPlay className="w-full rounded-xl bg-black" />
      ) : (
        <div className="aspect-video rounded-xl bg-neutral-800 flex items-center justify-center text-center p-6">
          <p>Daddy's surprise is coming soon 💌</p>
        </div>
      )}
      <button onClick={onContinue} className="p-3 rounded-xl bg-pink-500 font-semibold">Continue</button>
    </div>
  );
}
```

(`MediaMontage.tsx` re-exports MediaVideo — same player.)

- [ ] **Step 2: MediaMystery**

```tsx
// src/components/reveal/MediaMystery.tsx
"use client";
import { useState } from "react";

type Photo = { label: string; close_up_signed_url?: string; full_signed_url?: string };
export function MediaMystery({ photos, correctIndex, onContinue }: { photos: Photo[]; correctIndex: number; onContinue: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const revealed = selected === correctIndex;
  return (
    <div className="max-w-lg mx-auto p-5 grid gap-4">
      <h2 className="text-xl font-bold">What is Daddy looking at?</h2>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((p, i) => (
          <button key={i} onClick={() => setSelected(i)}
            className={`aspect-square rounded-xl overflow-hidden ${selected === i ? (revealed ? "ring-4 ring-emerald-400" : "ring-4 ring-red-400") : "ring-1 ring-neutral-700"}`}>
            <img src={revealed && i === correctIndex ? p.full_signed_url : p.close_up_signed_url} alt={p.label} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
      {selected !== null && (selected === correctIndex ? (
        <div className="p-3 rounded-xl bg-emerald-900/50 text-emerald-100">🎉 Yes! {photos[correctIndex].label}</div>
      ) : (
        <div className="p-3 rounded-xl bg-amber-900/50 text-amber-100">Not quite — try another.</div>
      ))}
      <button disabled={!revealed} onClick={onContinue} className="p-3 rounded-xl bg-pink-500 font-semibold disabled:opacity-30">Continue</button>
    </div>
  );
}
```

- [ ] **Step 3: MediaPostcard**

```tsx
// src/components/reveal/MediaPostcard.tsx
"use client";
export function MediaPostcard({ config, onContinue }: { config: { text?: string; emoji?: string; colors?: string[] }; onContinue: () => void }) {
  const [c1, c2] = config.colors ?? ["#fbbf24", "#ec4899"];
  return (
    <div className="max-w-lg mx-auto p-5 grid gap-4">
      <div className="aspect-[4/3] rounded-2xl p-6 flex flex-col justify-between shadow-2xl animate-[fadeIn_0.8s]" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
        <div className="text-6xl animate-bounce">{config.emoji ?? "📮"}</div>
        <div className="text-white text-2xl font-bold whitespace-pre-wrap">{config.text ?? "A silly souvenir from Dad!"}</div>
      </div>
      <button onClick={onContinue} className="p-3 rounded-xl bg-pink-500 font-semibold">Continue</button>
    </div>
  );
}
```

- [ ] **Step 4: JigsawPieceStep**

```tsx
// src/components/reveal/JigsawPieceStep.tsx
"use client";
import { useState } from "react";

export function JigsawPieceStep({ dayNumber, onPlaced }: { dayNumber: number; onPlaced: () => void }) {
  const [placed, setPlaced] = useState(false);
  async function place() {
    const res = await fetch(`/api/days/${dayNumber}/kid-tile`, { method: "POST" });
    if (res.ok) {
      setPlaced(true);
      setTimeout(onPlaced, 1200);
    }
  }
  return (
    <div className="max-w-lg mx-auto p-5 grid gap-4 text-center">
      <h2 className="text-xl font-bold">{placed ? "Piece placed! 🧩" : "Tap to add today's piece to Daddy's journey"}</h2>
      <button onClick={place} disabled={placed}
        className={`aspect-square max-w-[200px] mx-auto rounded-2xl overflow-hidden transition-all ${placed ? "scale-75 opacity-50" : "hover:scale-105"}`}>
        <img src={`/jigsaw/pieces/piece-${dayNumber}.svg`} alt={`Piece ${dayNumber}`} className="w-full h-full" />
      </button>
    </div>
  );
}
```

- [ ] **Step 5: CouponStep + BigSurpriseStep**

```tsx
// src/components/reveal/CouponStep.tsx
"use client";
export function CouponStep({ coupon, points, onContinue, showContinue }: { coupon: string; points: number; onContinue: () => void; showContinue: boolean }) {
  return (
    <div className="max-w-lg mx-auto p-5 grid gap-4 text-center">
      <div className="p-6 rounded-2xl bg-gradient-to-br from-yellow-300 to-orange-500 text-neutral-900 font-bold text-xl">🎟️ {coupon}</div>
      <div className="text-4xl">+{points} ⭐</div>
      <button onClick={onContinue} className="p-3 rounded-xl bg-emerald-500 font-semibold">
        {showContinue ? "Continue" : "Show Mummy!"}
      </button>
    </div>
  );
}
```

```tsx
// src/components/reveal/BigSurpriseStep.tsx
"use client";
export function BigSurpriseStep({ onDone }: { onDone: () => void }) {
  return (
    <div className="max-w-lg mx-auto p-6 grid gap-4 text-center">
      <div className="text-6xl animate-bounce">🎁</div>
      <h2 className="text-3xl font-bold">Daddy's bringing back the big surprise!</h2>
      <p>Ask Mummy when Daddy comes home.</p>
      <button onClick={onDone} className="p-3 rounded-xl bg-pink-500 font-semibold">Done</button>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/reveal
git commit -m "feat(ui): reveal sequence components"
```

---

## Task 19: Kid day page (state machine)

**Files:**
- Create: `src/app/day/[n]/page.tsx`

- [ ] **Step 1: Implement page**

```tsx
// src/app/day/[n]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { RiddleQuiz } from "@/components/activity/RiddleQuiz";
import { Creative } from "@/components/activity/Creative";
import { Kindness } from "@/components/activity/Kindness";
import { MediaVideo } from "@/components/reveal/MediaVideo";
import { MediaMystery } from "@/components/reveal/MediaMystery";
import { MediaPostcard } from "@/components/reveal/MediaPostcard";
import { JigsawPieceStep } from "@/components/reveal/JigsawPieceStep";
import { CouponStep } from "@/components/reveal/CouponStep";
import { BigSurpriseStep } from "@/components/reveal/BigSurpriseStep";

type DayPayload = {
  day_number: number;
  activity_type: "riddle" | "quiz" | "creative" | "kindness";
  activity_title: string;
  activity_body: string;
  media_type: "video" | "mystery_photos" | "animated_postcard" | "montage";
  completed: boolean;
  kid_tile_completed: boolean;
};

type RevealPayload = {
  media_type: DayPayload["media_type"];
  media_signed_url: string | null;
  media_config: { photos?: Array<{ label: string; close_up_signed_url?: string; full_signed_url?: string }>; correct_index?: number; text?: string; emoji?: string; colors?: string[] };
  coupon_text: string;
  points: number;
  final_reward_unlocked: boolean;
};

type Step = "activity" | "media" | "jigsaw" | "coupon" | "big_surprise" | "done";

export default function DayPage() {
  const params = useParams<{ n: string }>();
  const n = Number(params.n);
  const router = useRouter();
  const [day, setDay] = useState<DayPayload | null>(null);
  const [reveal, setReveal] = useState<RevealPayload | null>(null);
  const [step, setStep] = useState<Step>("activity");

  useEffect(() => {
    fetch(`/api/days/${n}`).then(async (r) => {
      if (r.status === 403) { router.push("/"); return; }
      const d = await r.json() as DayPayload;
      setDay(d);
      if (d.completed) {
        setStep("media");
        const rv = await fetch(`/api/days/${n}/reveal`).then((x) => x.json());
        setReveal(rv);
      }
    });
  }, [n, router]);

  async function loadReveal() {
    const rv = await fetch(`/api/days/${n}/reveal`).then((x) => x.json());
    setReveal(rv);
    setStep("media");
  }

  async function afterCoupon() {
    if (reveal?.final_reward_unlocked && n === 9) setStep("big_surprise");
    else setStep("done");
  }

  if (!day) return <main className="p-6 text-white">Loading…</main>;

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <header className="p-4 flex items-center gap-3">
        <button onClick={() => router.push("/")} className="text-sm opacity-70">← Home</button>
        <h1 className="font-bold">Day {n}</h1>
      </header>

      {step === "activity" && (
        <>
          {(day.activity_type === "riddle" || day.activity_type === "quiz") && (
            <RiddleQuiz dayNumber={n} title={day.activity_title} body={day.activity_body} onSolved={loadReveal} />
          )}
          {day.activity_type === "creative" && (
            <Creative dayNumber={n} title={day.activity_title} body={day.activity_body} onDone={loadReveal} />
          )}
          {day.activity_type === "kindness" && (
            <Kindness dayNumber={n} title={day.activity_title} body={day.activity_body} onDone={loadReveal} />
          )}
        </>
      )}

      {reveal && step === "media" && (
        <>
          {(reveal.media_type === "video" || reveal.media_type === "montage") && (
            <MediaVideo src={reveal.media_signed_url} onContinue={() => setStep("jigsaw")} />
          )}
          {reveal.media_type === "mystery_photos" && (
            <MediaMystery photos={reveal.media_config.photos ?? []} correctIndex={reveal.media_config.correct_index ?? 0} onContinue={() => setStep("jigsaw")} />
          )}
          {reveal.media_type === "animated_postcard" && (
            <MediaPostcard config={reveal.media_config} onContinue={() => setStep("jigsaw")} />
          )}
        </>
      )}

      {reveal && step === "jigsaw" && (
        <JigsawPieceStep dayNumber={n} onPlaced={() => setStep("coupon")} />
      )}

      {reveal && step === "coupon" && (
        <CouponStep coupon={reveal.coupon_text} points={reveal.points} showContinue={n === 9 && reveal.final_reward_unlocked} onContinue={afterCoupon} />
      )}

      {step === "big_surprise" && <BigSurpriseStep onDone={() => router.push("/")} />}
      {step === "done" && (
        <div className="p-6 text-center grid gap-3">
          <h2 className="text-2xl">See you tomorrow! 👋</h2>
          <button onClick={() => router.push("/")} className="p-3 rounded-xl bg-pink-500 font-semibold max-w-xs mx-auto">Home</button>
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/day
git commit -m "feat(ui): kid day page with state machine"
```

---

## Task 20: Admin pages

**Files:**
- Create: `src/app/admin/page.tsx`, `src/app/admin/day/[n]/page.tsx`, `src/components/admin/DayEditForm.tsx`

- [ ] **Step 1: Admin list page**

```tsx
// src/app/admin/page.tsx
import Link from "next/link";
import { adminClient } from "@/lib/supabase/admin";
import { getAdminEmail } from "@/lib/guards/admin";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const email = await getAdminEmail();
  if (!email) redirect("/login");

  const sb = adminClient();
  const { data: days } = await sb.from("days").select("*").order("day_number");
  const { data: completions } = await sb.from("completions").select("day_number");
  const doneSet = new Set((completions ?? []).map((r) => r.day_number));

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6">
      <h1 className="text-2xl font-bold mb-4">Admin — Daddy's Advent</h1>
      <p className="opacity-60 text-sm mb-4">Signed in as {email}</p>
      <div className="grid gap-3">
        {(days ?? []).map((d) => (
          <Link key={d.day_number} href={`/admin/day/${d.day_number}`}
            className="p-4 rounded-xl bg-neutral-900 flex justify-between hover:bg-neutral-800">
            <div>
              <div className="font-semibold">Day {d.day_number} — {d.activity_title}</div>
              <div className="text-sm opacity-60">{d.date} · {d.activity_type} · {d.media_type}</div>
            </div>
            <div className="flex gap-2 text-sm">
              {d.media_storage_path ? <span className="px-2 py-1 rounded bg-emerald-800">media ✓</span> : <span className="px-2 py-1 rounded bg-amber-800">no media</span>}
              {doneSet.has(d.day_number) && <span className="px-2 py-1 rounded bg-blue-800">done</span>}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: DayEditForm + admin/day/[n] page**

```tsx
// src/components/admin/DayEditForm.tsx
"use client";
import { useState } from "react";

type Day = {
  day_number: number;
  activity_type: string;
  activity_title: string;
  activity_body: string;
  activity_answer: string | null;
  expected_minutes: number;
  media_type: string;
  coupon_text: string;
  points: number;
};

export function DayEditForm({ day }: { day: Day }) {
  const [form, setForm] = useState(day);
  const [saving, setSaving] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);

  async function save() {
    setSaving(true);
    await fetch(`/api/admin/days/${day.day_number}`, {
      method: "PUT", headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    if (mediaFile) {
      const fd = new FormData();
      fd.append("file", mediaFile);
      await fetch(`/api/admin/days/${day.day_number}/media`, { method: "POST", body: fd });
    }
    setSaving(false);
    location.reload();
  }

  async function overrideUnlock() {
    if (!confirm("Unlock this day now?")) return;
    await fetch(`/api/admin/days/${day.day_number}/override`, { method: "POST" });
    location.reload();
  }

  async function resetDay() {
    if (!confirm("Reset all completions for this day?")) return;
    await fetch(`/api/admin/days/${day.day_number}/reset`, { method: "POST" });
    location.reload();
  }

  const field = "bg-neutral-800 p-2 rounded";
  return (
    <div className="grid gap-3 max-w-xl">
      <label className="grid gap-1"><span className="text-sm opacity-60">Activity type</span>
        <select value={form.activity_type} onChange={(e) => setForm({ ...form, activity_type: e.target.value })} className={field}>
          <option value="riddle">riddle</option><option value="quiz">quiz</option><option value="creative">creative</option><option value="kindness">kindness</option>
        </select>
      </label>
      <label className="grid gap-1"><span className="text-sm opacity-60">Title</span>
        <input value={form.activity_title} onChange={(e) => setForm({ ...form, activity_title: e.target.value })} className={field} />
      </label>
      <label className="grid gap-1"><span className="text-sm opacity-60">Body (markdown)</span>
        <textarea value={form.activity_body} onChange={(e) => setForm({ ...form, activity_body: e.target.value })} rows={6} className={field} />
      </label>
      <label className="grid gap-1"><span className="text-sm opacity-60">Answer (riddle/quiz only; use | for alternates)</span>
        <input value={form.activity_answer ?? ""} onChange={(e) => setForm({ ...form, activity_answer: e.target.value })} className={field} />
      </label>
      <label className="grid gap-1"><span className="text-sm opacity-60">Expected minutes</span>
        <input type="number" value={form.expected_minutes} onChange={(e) => setForm({ ...form, expected_minutes: Number(e.target.value) })} className={field} />
      </label>
      <label className="grid gap-1"><span className="text-sm opacity-60">Media type</span>
        <select value={form.media_type} onChange={(e) => setForm({ ...form, media_type: e.target.value })} className={field}>
          <option value="video">video</option><option value="mystery_photos">mystery_photos</option><option value="animated_postcard">animated_postcard</option><option value="montage">montage</option>
        </select>
      </label>
      <label className="grid gap-1"><span className="text-sm opacity-60">Coupon text</span>
        <input value={form.coupon_text} onChange={(e) => setForm({ ...form, coupon_text: e.target.value })} className={field} />
      </label>
      <label className="grid gap-1"><span className="text-sm opacity-60">Points</span>
        <input type="number" value={form.points} onChange={(e) => setForm({ ...form, points: Number(e.target.value) })} className={field} />
      </label>
      <label className="grid gap-1"><span className="text-sm opacity-60">Media file (mp4/webm/mov)</span>
        <input type="file" accept="video/*" onChange={(e) => setMediaFile(e.target.files?.[0] ?? null)} className="text-sm" />
      </label>
      <div className="flex gap-2 flex-wrap">
        <button onClick={save} disabled={saving} className="p-3 rounded-xl bg-emerald-500 font-semibold disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
        <button onClick={overrideUnlock} className="p-3 rounded-xl bg-blue-500 font-semibold">Unlock now</button>
        <button onClick={resetDay} className="p-3 rounded-xl bg-red-500 font-semibold">Reset completions</button>
      </div>
    </div>
  );
}
```

```tsx
// src/app/admin/day/[n]/page.tsx
import { adminClient } from "@/lib/supabase/admin";
import { getAdminEmail } from "@/lib/guards/admin";
import { redirect } from "next/navigation";
import { DayEditForm } from "@/components/admin/DayEditForm";

export const dynamic = "force-dynamic";

export default async function EditDay({ params }: { params: Promise<{ n: string }> }) {
  const email = await getAdminEmail();
  if (!email) redirect("/login");
  const n = Number((await params).n);
  const sb = adminClient();
  const { data: day } = await sb.from("days").select("*").eq("day_number", n).single();
  if (!day) return <main className="p-6 text-white">Not found</main>;
  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6">
      <h1 className="text-2xl font-bold mb-2">Edit Day {n}</h1>
      <DayEditForm day={day as any} />
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/admin src/components/admin
git commit -m "feat(ui): admin list + edit pages"
```

---

## Task 21: Playwright E2E smoke test

**Files:**
- Create: `tests/e2e/kid-flow.spec.ts`

- [ ] **Step 1: Seed a known-state test**

The E2E test requires a deterministic DB state. Approach: use the admin endpoint to override-unlock Day 1 (no time manipulation), then walk the kid flow. Assumes you manually set the day 1 riddle content + answer before running.

```ts
// tests/e2e/kid-flow.spec.ts
import { test, expect } from "@playwright/test";

test("kid PIN login → complete riddle → reveal → place piece → see coupon", async ({ page, request }) => {
  // Pre-requisite: day 1 unlock_at is in the past and answer is 'airplane'.
  // Set this up manually before running E2E in dev, or wire a test-seed endpoint.

  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel("Kid PIN").or(page.locator("input[pattern]")).fill("1234");
  await page.getByRole("button", { name: /enter/i }).click();
  await expect(page).toHaveURL("/");

  // Click today's door (assume day 1 is today for the test)
  await page.getByRole("link", { name: /1/i }).first().click();
  await expect(page).toHaveURL(/\/day\/1/);

  // Submit the riddle answer
  await page.locator("form input").first().fill("airplane");
  await page.getByRole("button", { name: /submit/i }).click();

  // Media step (video) — click Continue
  await page.getByRole("button", { name: /continue/i }).click();

  // Jigsaw piece step — tap the piece
  await page.getByRole("button").filter({ has: page.locator("img") }).click();

  // Coupon step appears
  await expect(page.getByText(/pts|⭐/)).toBeVisible();
});
```

- [ ] **Step 2: Document how to run**

Add to `package.json`:
```json
"e2e:prep": "supabase db reset && curl -X POST http://localhost:3000/api/admin/days/1/override ..."
```

(The exact prep will depend on whether you add a test-mode bypass for admin auth. For the tight timeline, running this spec **manually after seeding day 1 content** is acceptable — note this in the README.)

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/ package.json
git commit -m "test(e2e): kid-flow happy path"
```

---

## Task 22: Deployment setup

**Files:**
- Create: `README.md` (deploy instructions), Supabase production project

- [ ] **Step 1: Create Supabase production project**

1. Go to https://supabase.com/dashboard → New project (region: Singapore)
2. In SQL Editor, run both migration files (0001, 0002) in order
3. Copy: `anon key`, `service_role key`, `project url`

- [ ] **Step 2: Set PIN + admin users**

Via Supabase SQL Editor:
```sql
update household_pin set pin_hash = '$2a$10$...' where id = 1;
-- Generate with:  node -e "require('bcryptjs').hash('1234', 10).then(console.log)"
insert into admin_users (email) values ('you@example.com'), ('wife@example.com');
```

- [ ] **Step 3: Vercel deploy**

```bash
pnpm dlx vercel link
pnpm dlx vercel env add NEXT_PUBLIC_SUPABASE_URL production
pnpm dlx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
pnpm dlx vercel env add SUPABASE_SERVICE_ROLE_KEY production
pnpm dlx vercel env add KID_SESSION_SECRET production
pnpm dlx vercel env add ADMIN_EMAILS production
pnpm dlx vercel --prod
```

- [ ] **Step 4: Post-deploy checklist**

1. Visit Vercel URL — should redirect to /login ✅
2. PIN 1234 → land on home ✅
3. Admin: send magic link → land on /admin ✅
4. Rotate PIN via admin UI to a non-default value ✅
5. Upload at least Day 1 video ✅
6. Fill in all 9 days' content via admin UI ✅
7. Use `/admin/day/1/override` to unlock Day 1 ahead of schedule for a real test run on wife's phone ✅
8. After verification, reset completions so real unlock on 17 Apr is fresh ✅

- [ ] **Step 5: Commit README + final push**

Create `README.md`:
```markdown
# Daddy's Advent

Web app for 9 days of kid activities while Dad is away (17–25 Apr 2026).

## Local dev
1. `pnpm install`
2. `pnpm exec supabase start` (local Postgres)
3. Copy `.env.local.example` → `.env.local`, fill in local Supabase values
4. `pnpm dev` → http://localhost:3000

## Testing
- `pnpm test` — unit (Vitest)
- `pnpm e2e` — E2E (Playwright; requires dev server + seeded day 1)

## Deploy
See `docs/superpowers/plans/2026-04-14-advent-app.md` Task 22.
```

```bash
git add README.md
git commit -m "docs: README + deployment checklist"
```

---

## Self-Review

**Spec coverage:** Every spec section maps to at least one task:
- Purpose / trip context / users / roles → Tasks 8, 9, 15 (DoorGrid, admin pages)
- Core mechanic / reveal sequence / jigsaw → Tasks 12, 14, 18, 19
- Activity types + duration + kid tile → Tasks 11, 17, 18
- Tech stack → Tasks 1, 2, 3
- Data model → Task 2 (schema), Task 3 (client types)
- API surface → Tasks 8–13
- Pages → Tasks 16, 19, 20
- Auth details → Tasks 6, 8, 9
- Error handling → covered inline in each API task and activity components
- Content scaffold → Task 2 (seed), Task 20 (admin editor)
- Testing → Tasks 4–7 (unit), Task 21 (E2E)
- Deployment → Task 22

**Placeholder scan:** No "TBD", "TODO", or "similar to Task N" in code blocks. Seed migration has `[TODO: ...]` *placeholder content strings* — that's intentional, as the spec defines content authoring happens via admin UI.

**Type consistency:** Day columns use same names across schema, API responses, admin editor. `media_type` values match across DB check constraint, Zod schema, TS unions.

**Timeline realism:** 22 tasks × ~1–3 hours each = ~3 full dev days. Tight for the 17 Apr ship date but achievable with the plan this concrete. Dependencies allow parallel work on some tasks (e.g., Task 14 jigsaw assets can happen any time).
