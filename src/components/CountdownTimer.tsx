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
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border-[2px] border-ink bg-white shadow-[2px_2px_0_var(--color-ink)] tabular-nums font-display text-lg">
      {h}h {m}m {s}s
    </span>
  );
}
