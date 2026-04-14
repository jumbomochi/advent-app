"use client";
import { useState } from "react";

type Variant = "kid" | "admin";

export function PinRotator({
  variant = "kid",
}: { variant?: Variant } = {}) {
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "err">("idle");
  const digits = variant === "admin" ? 6 : 4;
  const endpoint = variant === "admin" ? "/api/admin/admin-pin" : "/api/admin/pin";
  const label = variant === "admin" ? "New 6-digit parent PIN" : "New 4-digit kid PIN";
  const regex = variant === "admin" ? /^\d{6}$/ : /^\d{4}$/;
  const spacing = variant === "admin" ? "tracking-[0.3em]" : "tracking-[0.4em]";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!regex.test(pin)) return;
    setStatus("saving");
    const res = await fetch(endpoint, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ new_pin: pin }),
    });
    setStatus(res.ok ? "done" : "err");
    if (res.ok) setPin("");
  }

  return (
    <form onSubmit={submit} className="flex items-end gap-2 max-w-xs">
      <label className="grid gap-1 flex-1">
        <span className="text-xs text-neutral-500">{label}</span>
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, digits))}
          inputMode="numeric"
          maxLength={digits}
          className={`bg-white border border-neutral-300 rounded p-2 text-center font-mono ${spacing}`}
        />
      </label>
      <button
        type="submit"
        disabled={pin.length !== digits || status === "saving"}
        className="px-4 py-2 rounded bg-blue-600 text-white font-medium disabled:opacity-50"
      >
        Rotate
      </button>
      {status === "done" && <span className="text-emerald-600 text-sm">Saved</span>}
      {status === "err" && <span className="text-red-600 text-sm">Error</span>}
    </form>
  );
}
