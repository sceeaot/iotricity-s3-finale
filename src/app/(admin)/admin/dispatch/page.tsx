"use client";

import { useEffect, useState, useMemo } from "react";

type Purchase = {
  _id: string;
  receiptId: string;
  teamName: string;
  componentName: string;
  cyberpunkName?: string;
  pricePaid?: number;
  dispatched: boolean;
  purchasedAt?: string;
};

type ReceiptGroup = {
  receiptId: string;
  teamName: string;
  items: Purchase[];
  componentNames: string[];
  totalPrice: number;
  dispatched: boolean;
  purchasedAt?: string;
};

export default function Dispatch() {
  const [items, setItems] = useState<Purchase[]>([]);
  const [busy, setBusy] = useState("");

  async function load() {
    try {
      const r = await fetch("/api/admin/dispatch");
      const d = await r.json();
      setItems(d.purchases || []);
    } catch (e) {
      console.error("Failed to load dispatch queue:", e);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, ReceiptGroup>();
    for (const p of items) {
      const rId = p.receiptId || p._id;
      const actualName = p.componentName || p.cyberpunkName || "Component";
      if (!map.has(rId)) {
        map.set(rId, {
          receiptId: rId,
          teamName: p.teamName,
          items: [p],
          componentNames: [actualName],
          totalPrice: p.pricePaid || 0,
          dispatched: p.dispatched,
          purchasedAt: p.purchasedAt,
        });
      } else {
        const group = map.get(rId)!;
        group.items.push(p);
        group.componentNames.push(actualName);
        group.totalPrice += p.pricePaid || 0;
        if (!p.dispatched) {
          group.dispatched = false;
        }
      }
    }
    return Array.from(map.values());
  }, [items]);

  async function dispatchReceipt(receiptId: string, teamName: string, names: string[]) {
    if (
      !window.confirm(
        `Confirm dispatch:\nTeam: ${teamName}\nComponents: ${names.join(", ")}\nReceipt: ${receiptId}`
      )
    ) {
      return;
    }
    setBusy(receiptId);
    try {
      await fetch("/api/admin/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptId }),
      });
      await load();
    } catch (e) {
      console.error("Dispatch error:", e);
    } finally {
      setBusy("");
    }
  }

  const pending = grouped.filter((g) => !g.dispatched);
  const done = grouped.filter((g) => g.dispatched);

  return (
    <main className="py-[42px] pb-[70px] max-[760px]:pt-[28px] w-[min(1180px,calc(100%-40px))] max-[760px]:w-[min(calc(100%-28px),620px)] mx-auto max-w-[850px]">
      <div className="flex justify-between items-end mb-[30px]">
        <div>
          <p className="text-acid text-[11px] tracking-[.16em] uppercase">HARDWARE HANDOFF / LIVE QUEUE</p>
          <h1 className="text-[40px] mt-[12px] mb-0 font-bold">Dispatch desk</h1>
        </div>
        <a
          href="/admin/dashboard"
          className="border border-line bg-transparent text-paper px-4 py-3 font-bold no-underline inline-block hover:bg-white/10 transition"
        >
          CONTROL ROOM
        </a>
      </div>

      <p className="text-orange text-[11px] tracking-[.16em] uppercase mb-[12px]">
        PENDING ORDERS / {pending.length}
      </p>

      {pending.map((g) => (
        <div
          className="border border-orange bg-[#101313]/78 p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-5 mb-[12px]"
          key={g.receiptId}
        >
          <div>
            <div className="flex items-center gap-2">
              <strong className="font-bold text-lg text-white">{g.teamName}</strong>
              <span className="text-[11px] font-mono border border-orange/40 text-orange px-2 py-0.5">
                {g.items.length} {g.items.length === 1 ? "ITEM" : "ITEMS"}
              </span>
            </div>
            <p className="text-white/80 font-medium text-sm mt-1.5 mb-1">
              {g.componentNames.join(", ")}
            </p>
            <p className="text-muted text-xs font-mono">
              Receipt #{g.receiptId} • Total: {g.totalPrice} BC
            </p>
          </div>
          <button
            className="border border-acid bg-acid text-ink px-4 py-3 font-bold no-underline inline-block hover:bg-[#efffa8] disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer transition shrink-0"
            onClick={() => dispatchReceipt(g.receiptId, g.teamName, g.componentNames)}
            disabled={busy === g.receiptId}
          >
            {busy === g.receiptId ? "DISPATCHING..." : "MARK DISPATCHED"}
          </button>
        </div>
      ))}

      {pending.length === 0 && <p className="text-muted mb-[35px]">No pending receipts.</p>}

      <p className="text-cyan text-[11px] tracking-[.16em] uppercase mt-[34px] mb-[12px]">
        DISPATCHED ORDERS / {done.length}
      </p>

      {done.map((g) => (
        <div
          key={g.receiptId}
          className="border-b border-line py-[14px] text-xs text-muted flex flex-col sm:flex-row justify-between sm:items-center gap-2"
        >
          <div>
            <span className="text-white font-semibold">{g.teamName}</span>
            <span className="text-white/60 mx-1.5">—</span>
            <span className="text-white/80">{g.componentNames.join(", ")}</span>
            <span className="text-muted/60 font-mono ml-2">({g.receiptId})</span>
          </div>
          <span className="text-acid text-[11px] uppercase font-bold tracking-wider shrink-0">
            DISPATCHED
          </span>
        </div>
      ))}
    </main>
  );
}