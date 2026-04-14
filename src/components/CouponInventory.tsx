"use client";
import { useEffect, useState, useTransition } from "react";

type Coupon = {
  day_number: number;
  coupon_text: string;
  points: number;
  earned_at: string;
  redeemed_at: string | null;
};

export function CouponInventory() {
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [, startTransition] = useTransition();

  async function load() {
    const r = await fetch("/api/inventory");
    if (!r.ok) { setCoupons([]); return; }
    const data = (await r.json()) as { coupons: Coupon[] };
    setCoupons(data.coupons);
  }

  useEffect(() => { load(); }, []);

  async function redeem(n: number) {
    if (!confirm("Ask Mummy before tapping!\n\nRedeem this coupon now?")) return;
    const r = await fetch(`/api/coupons/${n}/redeem`, { method: "POST" });
    if (r.ok) startTransition(() => load());
  }

  if (coupons === null) {
    return (
      <section className="max-w-md mx-auto p-4">
        <h2 className="font-display text-2xl text-center text-accent mb-2">Your Coupons</h2>
        <p className="text-center font-body text-sm opacity-60">Loading…</p>
      </section>
    );
  }

  return (
    <section className="max-w-md mx-auto p-4">
      <h2 className="font-display text-2xl text-center text-accent mb-3">Your Coupons</h2>
      {coupons.length === 0 ? (
        <div className="p-4 rounded-xl border-[2px] border-dashed border-ink/40 bg-white/60 text-center font-body text-sm">
          Complete a door to earn your first coupon!
        </div>
      ) : (
        <ul className="grid gap-2">
          {coupons.map((c) => {
            const isUsed = c.redeemed_at !== null;
            return (
              <li
                key={c.day_number}
                className={`relative p-3 rounded-xl border-[3px] border-ink shadow-[3px_3px_0_var(--color-ink)] flex items-center gap-3 ${isUsed ? "bg-white opacity-60" : "bg-sun"}`}
              >
                <div className="font-display text-3xl shrink-0 w-10 text-center">{c.day_number}</div>
                <div className="flex-1 min-w-0">
                  <div className={`font-body text-sm leading-snug ${isUsed ? "line-through" : ""}`}>{c.coupon_text}</div>
                </div>
                {isUsed ? (
                  <span className="font-display text-lg text-grass shrink-0" aria-label="Used">Used ✓</span>
                ) : (
                  <button
                    onClick={() => redeem(c.day_number)}
                    className="shrink-0 px-3 py-1 rounded-lg bg-accent text-white font-display text-base border-[2px] border-ink shadow-[2px_2px_0_var(--color-ink)] active:translate-y-[1px] active:shadow-[1px_1px_0_var(--color-ink)]"
                  >
                    Redeem
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
