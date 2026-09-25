"use client";

import { useEffect, useState } from "react";

type Purchase = {
  _id: string;
  receiptId: string;
  teamName: string;
  cyberpunkName: string;
  componentName: string;
  dispatched: boolean;
};

export default function Dispatch() {
  const [items, setItems] = useState<Purchase[]>([]);
  const [busy, setBusy] = useState("");

  async function load() {
    const r = await fetch("/api/admin/dispatch");
    setItems((await r.json()).purchases || []);
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  async function dispatch(p: Purchase) {
    if (
      !window.confirm(
        `Confirm dispatch:\nTeam: ${p.teamName}\nComponent: ${p.componentName}\nReceipt: ${p.receiptId}`,
      )
    )
      return;
    setBusy(p.receiptId);
    await fetch("/api/admin/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiptId: p.receiptId }),
    });
    setBusy("");
    load();
  }

  const pending = items.filter((p) => !p.dispatched);
  const done = items.filter((p) => p.dispatched);

  return (
    <main className="py-[42px] pb-[70px] max-[760px]:pt-[28px] w-[min(1180px,calc(100%-40px))] max-[760px]:w-[min(calc(100%-28px),620px)] mx-auto max-w-[850px]">
      <div className="flex justify-between items-end mb-[30px]">
        <div>
          <p className="text-acid text-[11px] tracking-[.16em] uppercase">HARDWARE HANDOFF / LIVE QUEUE</p>
          <h1 className="text-[40px] mt-[12px] mb-0 font-bold">Dispatch desk</h1>
        </div>
        <a href="/admin/dashboard" className="border border-line bg-transparent text-paper px-4 py-3 font-bold no-underline inline-block hover:bg-white/10 transition">
          CONTROL ROOM
        </a>
      </div>
      <p className="text-orange text-[11px] tracking-[.16em] uppercase mb-[12px]">
        PENDING / {pending.length}
      </p>
      {pending.map((p) => (
        <div
          className="border border-orange bg-[#101313]/78 p-6 flex justify-between items-center gap-5 mb-[10px]"
          key={p._id}
        >
          <div>
            <strong className="font-bold">{p.teamName}</strong>
            <p className="text-muted mt-2 mb-0">
              {p.cyberpunkName} / {p.receiptId}
            </p>
          </div>
          <button
            className="border border-acid bg-acid text-ink px-4 py-3 font-bold no-underline inline-block hover:bg-[#efffa8] disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer transition"
            onClick={() => dispatch(p)}
            disabled={busy === p.receiptId}
          >
            {busy === p.receiptId ? "..." : "MARK DISPATCHED"}
          </button>
        </div>
      ))}
      {pending.length === 0 && <p className="text-muted mb-[35px]">No pending receipts.</p>}
      <p className="text-cyan text-[11px] tracking-[.16em] uppercase mt-[34px] mb-[12px]">
        DISPATCHED / {done.length}
      </p>
      {done.map((p) => (
        <div
          key={p._id}
          className="border-b border-line py-[13px] text-xs text-muted flex justify-between"
        >
          <span>
            {p.teamName} / {p.cyberpunkName}
          </span>
          <span className="text-acid text-[11px] uppercase font-bold">complete</span>
        </div>
      ))}
    </main>
  );
}