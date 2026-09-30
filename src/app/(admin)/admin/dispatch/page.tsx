"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Package,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Search,
  RefreshCw,
  Box,
  Cpu,
  Layers,
  Shield,
  Coins,
  Radio,
} from "lucide-react";
import EventTimerDisplay from "@/components/EventTimerDisplay";

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

function CornerMarks({ size = 10 }: { size?: number }) {
  return (
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-[1px] -top-[1px] border-l-2 border-t-2 border-cyan/80"
        style={{ width: size, height: size }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-[1px] -top-[1px] border-r-2 border-t-2 border-cyan/80"
        style={{ width: size, height: size }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[1px] -left-[1px] border-b-2 border-l-2 border-cyan/80"
        style={{ width: size, height: size }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[1px] -right-[1px] border-b-2 border-r-2 border-cyan/80"
        style={{ width: size, height: size }}
      />
    </>
  );
}

export default function DispatchPage() {
  const [items, setItems] = useState<Purchase[]>([]);
  const [busy, setBusy] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [lastSyncTime, setLastSyncTime] = useState("");

  async function load() {
    try {
      const r = await fetch("/api/admin/dispatch");
      if (r.ok) {
        const d = await r.json();
        setItems(d.purchases || []);
        setLastSyncTime(new Date().toLocaleTimeString());
      }
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
        `CONFIRM HARDWARE HANDOFF:\n\nSquad: ${teamName}\nItems: ${names.join(", ")}\nReceipt: #${receiptId}\n\nMark this physical kit as handed over?`
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

  const filteredGrouped = useMemo(() => {
    if (!searchQuery.trim()) return grouped;
    const q = searchQuery.toLowerCase();
    return grouped.filter(
      (g) =>
        g.teamName.toLowerCase().includes(q) ||
        g.receiptId.toLowerCase().includes(q) ||
        g.componentNames.some((n) => n.toLowerCase().includes(q))
    );
  }, [grouped, searchQuery]);

  const pending = filteredGrouped.filter((g) => !g.dispatched);
  const done = filteredGrouped.filter((g) => g.dispatched);

  return (
    <div className="min-h-screen bg-[#040711] text-paper selection:bg-cyan selection:text-ink">
      {/* Background ambient lighting */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[600px] h-[300px] bg-amber-500/5 blur-[140px] rounded-full" />
        <div className="absolute bottom-10 right-10 w-[450px] h-[350px] bg-cyan/5 blur-[120px] rounded-full" />
      </div>

      {/* Header Bar */}
      <header className="sticky top-0 z-40 border-b border-line/80 bg-[#040711]/90 backdrop-blur-md">
        <div className="w-[min(1240px,calc(100%-40px))] mx-auto py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <a
              href="/admin/dashboard"
              className="p-1.5 border border-line bg-[#091020] text-muted hover:text-white transition"
              title="Return to Control Room"
            >
              <ArrowLeft className="w-4 h-4" />
            </a>
            <div>
              <span className="font-bold text-sm tracking-[0.1em] text-white flex items-center gap-2">
                IOTRICITY <span className="text-amber-400">// HARDWARE DISPATCH DESK</span>
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-2 ml-2 px-2 py-0.5 border border-line bg-[#091020] text-[10px] font-mono text-cyan">
              <Radio className="w-2.5 h-2.5 text-cyan animate-pulse" />
              <span>5S SYNC</span>
              {lastSyncTime && <span className="text-muted/60">({lastSyncTime})</span>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <EventTimerDisplay
              label="EVENT TIMER"
              align="right"
              labelClassName="text-[10px] uppercase tracking-[.1em] text-white/50"
              timeClassName="text-sm font-medium tabular-nums"
            />
            <a
              href="/admin/dashboard"
              className="px-3 py-1.5 border border-line bg-[#091020] hover:bg-white/5 text-muted hover:text-white font-mono text-xs transition flex items-center gap-1.5"
            >
              <span>MISSION CONTROL ROOM</span>
            </a>
          </div>
        </div>
      </header>

      <main className="w-[min(1240px,calc(100%-40px))] mx-auto py-6 sm:py-8 space-y-6">
        {/* Banner with Queue Summary */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
          <div className="relative border border-amber-500/40 bg-amber-500/10 p-5 backdrop-blur-xs">
            <CornerMarks size={8} />
            <div className="flex items-center justify-between text-amber-300 text-xs uppercase tracking-wider mb-2">
              <span>PENDING PHYSICAL HANDOFFS</span>
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-display text-white">{pending.length}</span>
              <span className="text-xs text-amber-300">RECEIPTS WAITING</span>
            </div>
          </div>

          <div className="relative border border-cyan/30 bg-cyan/5 p-5 backdrop-blur-xs">
            <CornerMarks size={8} />
            <div className="flex items-center justify-between text-cyan text-xs uppercase tracking-wider mb-2">
              <span>DISPATCHED HARDWARE</span>
              <CheckCircle2 className="w-4 h-4 text-cyan" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-display text-white">{done.length}</span>
              <span className="text-xs text-muted">CONFIRMED HANDOFFS</span>
            </div>
          </div>

          <div className="relative border border-line bg-[#080d1a]/80 p-5 backdrop-blur-xs flex flex-col justify-center">
            <CornerMarks size={8} />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Search squad, receipt ID, or part..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#0d1527] border border-line text-xs font-mono text-white placeholder-muted/50 outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </section>

        {/* PENDING RECEIPTS SECTION */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-2 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-amber-300">
                PENDING PHYSICAL HANDOFF QUEUE ({pending.length})
              </h2>
            </div>
            <span className="text-xs text-muted">VERIFY PARTICIPANT RECEIPT CODE BEFORE RELEASING</span>
          </div>

          {pending.length === 0 ? (
            <div className="relative border border-line bg-[#080d1a]/80 p-8 text-center font-mono">
              <CornerMarks size={8} />
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
              <p className="text-white text-sm font-bold">ALL PHYSICAL HARDWARE DISPATCHED</p>
              <p className="text-muted text-xs mt-1">No participant teams are currently waiting at the armory desk.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pending.map((g) => (
                <div
                  key={g.receiptId}
                  className="relative border border-amber-500/50 bg-[#0c1424]/90 backdrop-blur-md p-5 space-y-4 shadow-xl"
                >
                  <CornerMarks size={10} />

                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-amber-400/90 uppercase tracking-widest block">
                        CLAIMING SQUAD
                      </span>
                      <h3 className="text-xl font-bold font-display text-white mt-0.5">{g.teamName}</h3>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-[10px] text-muted block">RECEIPT ID</span>
                      <span className="text-xs text-white font-mono bg-black/50 px-2 py-0.5 border border-line">
                        #{g.receiptId.slice(-8).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Component list */}
                  <div className="p-3 bg-[#080d18] border border-line/80 space-y-2">
                    <span className="text-[10px] font-mono text-muted uppercase tracking-wider block">
                      PARTS TO DISPATCH ({g.items.length})
                    </span>
                    <ul className="space-y-1.5 font-mono text-xs">
                      {g.componentNames.map((name, i) => (
                        <li key={i} className="flex items-center gap-2 text-white">
                          <Cpu className="w-3.5 h-3.5 text-cyan shrink-0" />
                          <span>{name}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="pt-2 border-t border-line/40 flex items-center justify-between text-[11px] font-mono text-muted">
                      <span>Total Paid:</span>
                      <span className="text-cyan font-bold">{g.totalPrice} BC</span>
                    </div>
                  </div>

                  {/* Dispatch Action Button */}
                  <button
                    onClick={() => dispatchReceipt(g.receiptId, g.teamName, g.componentNames)}
                    disabled={busy === g.receiptId}
                    className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-[#040711] font-mono font-bold text-xs uppercase tracking-widest transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20"
                  >
                    <Package className="w-4 h-4" />
                    <span>
                      {busy === g.receiptId ? "CONFIRMING HANDOFF..." : "CONFIRM PHYSICAL HANDOFF"}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* DISPATCHED COMPLETED AUDIT LOG */}
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between border-b border-line pb-2 font-mono">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted">
              DISPATCHED AUDIT LOG ({done.length})
            </h2>
            <span className="text-xs text-muted/70">HISTORICAL HANDOFF LEDGER</span>
          </div>

          {done.length === 0 ? (
            <p className="text-xs font-mono text-muted italic">No completed dispatches logged yet.</p>
          ) : (
            <div className="border border-line bg-[#080d1a]/85 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="border-b border-line bg-[#0c1424] text-[10px] uppercase tracking-wider text-muted">
                      <th className="py-2.5 px-4">RECEIPT</th>
                      <th className="py-2.5 px-4">SQUAD</th>
                      <th className="py-2.5 px-4">COMPONENTS HANDED OVER</th>
                      <th className="py-2.5 px-4 text-right">TOTAL BC</th>
                      <th className="py-2.5 px-4 text-center">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/40">
                    {done.map((g) => (
                      <tr key={g.receiptId} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 text-muted/80">
                          #{g.receiptId.slice(-8).toUpperCase()}
                        </td>
                        <td className="py-3 px-4 font-bold text-white">{g.teamName}</td>
                        <td className="py-3 px-4 text-paper/90">
                          {g.componentNames.join(", ")}
                        </td>
                        <td className="py-3 px-4 text-right text-cyan font-bold">
                          {g.totalPrice} BC
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>DISPATCHED</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}