"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton({ variant = "kid" }: { variant?: "kid" | "admin" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    if (variant === "kid") {
      await fetch("/api/kid-auth/logout", { method: "POST" });
    } else {
      const { createBrowserClient } = await import("@supabase/ssr");
      const sb = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
      await sb.auth.signOut();
    }
    router.push("/login");
    router.refresh();
  }

  const classes = variant === "kid"
    ? "px-3 py-1 rounded-lg border-[2px] border-ink bg-white font-display text-lg shadow-[2px_2px_0_var(--color-ink)] active:translate-y-[1px] active:shadow-[1px_1px_0_var(--color-ink)] disabled:opacity-50"
    : "px-3 py-1 rounded bg-neutral-200 hover:bg-neutral-300 text-sm font-medium disabled:opacity-50";

  return (
    <button onClick={logout} disabled={busy} className={classes}>
      {busy ? "…" : "Logout"}
    </button>
  );
}
