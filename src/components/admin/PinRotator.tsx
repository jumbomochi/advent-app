"use client";
import { useState } from "react";

export function PinRotator() {
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "err">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4}$/.test(pin)) return;
    setStatus("saving");
    const res = await fetch("/api/admin/pin", {
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
        <span className="text-xs text-neutral-500">New 4-digit PIN</span>
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          inputMode="numeric"
          maxLength={4}
          className="bg-white border border-neutral-300 rounded p-2 text-center tracking-[0.4em] font-mono"
        />
      </label>
      <button
        type="submit"
        disabled={pin.length !== 4 || status === "saving"}
        className="px-4 py-2 rounded bg-blue-600 text-white font-medium disabled:opacity-50"
      >
        Rotate
      </button>
      {status === "done" && <span className="text-emerald-600 text-sm">Saved</span>}
      {status === "err" && <span className="text-red-600 text-sm">Error</span>}
    </form>
  );
}
