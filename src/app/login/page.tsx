"use client";
import { useState, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

function LoginInner() {
  const router = useRouter();
  const search = useSearchParams();
  const returnTo = search.get("return_to") ?? "/";
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [shaking, setShaking] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [adminErr, setAdminErr] = useState("");
  const [adminShaking, setAdminShaking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [adminBusy, setAdminBusy] = useState(false);

  async function submitPin(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const res = await fetch("/api/kid-auth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    setBusy(false);
    if (res.ok) router.push(returnTo);
    else {
      setShaking(true);
      setTimeout(() => setShaking(false), 320);
      if (res.status === 429) setErr("Too many tries. Wait 15 minutes and try again.");
      else setErr("Wrong PIN. Try again!");
    }
  }

  async function submitAdminPin(e: React.FormEvent) {
    e.preventDefault();
    setAdminErr("");
    setAdminBusy(true);
    const res = await fetch("/api/admin-auth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pin: adminPin }),
    });
    setAdminBusy(false);
    if (res.ok) router.push("/admin");
    else {
      setAdminShaking(true);
      setTimeout(() => setAdminShaking(false), 320);
      if (res.status === 429) setAdminErr("Too many tries. Wait 15 minutes and try again.");
      else setAdminErr("Wrong PIN.");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm grid gap-5">
        <div className="flex flex-col items-center gap-2">
          <Image src="/brand/logo.png" alt="Where's Papa logo" width={140} height={140} priority className="drop-shadow-[4px_4px_0_rgba(15,23,42,0.15)]" />
          <h1 className="text-center font-display text-5xl text-accent">Where&apos;s Papa?</h1>
        </div>

        <form
          onSubmit={submitPin}
          className={`p-5 rounded-2xl bg-white border-[3px] border-ink shadow-[5px_5px_0_var(--color-ink)] grid gap-3 ${shaking ? "animate-shake" : ""}`}
        >
          <label className="font-display text-2xl text-ink">Enter your PIN</label>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            autoFocus
            className="bg-paper p-3 rounded-lg border-[2px] border-ink font-display text-3xl text-center tracking-[0.4em]"
            aria-label="Kid PIN"
          />
          <button
            disabled={busy || pin.length !== 4}
            className="p-3 rounded-lg bg-accent text-white font-display text-2xl border-[3px] border-ink shadow-[3px_3px_0_var(--color-ink)] active:translate-y-[2px] active:shadow-[1px_1px_0_var(--color-ink)] disabled:opacity-40 disabled:pointer-events-none"
          >
            {busy ? "Checking..." : "Enter"}
          </button>
          {err && <p className="text-accent text-sm font-medium">{err}</p>}
        </form>

        <details className="p-4 rounded-2xl bg-white/60 border-[2px] border-ink/30">
          <summary className="cursor-pointer text-sm font-medium text-ink/70">Parent login</summary>
          <form
            onSubmit={submitAdminPin}
            className={`mt-3 grid gap-2 ${adminShaking ? "animate-shake" : ""}`}
          >
            <input
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              placeholder="6-digit PIN"
              className="bg-paper p-2 rounded-lg border-[2px] border-ink text-center tracking-[0.35em] font-mono"
              aria-label="Parent PIN"
            />
            <button
              disabled={adminBusy || adminPin.length !== 6}
              className="p-2 rounded-lg bg-sky text-ink font-medium border-[2px] border-ink text-sm disabled:opacity-40 disabled:pointer-events-none"
            >
              {adminBusy ? "Checking..." : "Enter"}
            </button>
            {adminErr && <p className="text-accent text-sm font-medium">{adminErr}</p>}
          </form>
        </details>
      </div>
    </main>
  );
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen grid place-items-center">
          <p>Loading…</p>
        </main>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
