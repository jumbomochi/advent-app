"use client";

export function CouponStep({
  coupon, points, onContinue, showContinue,
}: { coupon: string; points: number; onContinue: () => void; showContinue: boolean }) {
  return (
    <div className="max-w-sm mx-auto p-4 grid gap-4 animate-fade-up">
      <div className="p-6 rounded-2xl bg-sun text-ink border-[3px] border-ink shadow-[5px_5px_0_var(--color-ink)] text-center">
        <div className="font-display text-2xl text-accent">🎟️ Coupon</div>
        <div className="font-body text-xl mt-2 whitespace-pre-wrap">{coupon}</div>
      </div>
      <div className="text-center font-display text-4xl text-accent">+{points} ⭐</div>
      <button
        onClick={onContinue}
        className="p-3 rounded-xl bg-grass text-ink font-display text-2xl border-[3px] border-ink shadow-[3px_3px_0_var(--color-ink)] active:translate-y-[2px] active:shadow-[1px_1px_0_var(--color-ink)]"
      >
        {showContinue ? "Continue" : "Show Mummy!"}
      </button>
    </div>
  );
}
