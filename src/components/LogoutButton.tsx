"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton({ variant = "kid" }: { variant?: "kid" | "admin" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    const url = variant === "kid" ? "/api/kid-auth/logout" : "/api/admin-auth/logout";
    await fetch(url, { method: "POST" });
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
