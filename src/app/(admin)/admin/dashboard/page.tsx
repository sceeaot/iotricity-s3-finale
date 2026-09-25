"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Team = {
  _id: string;
  rank: number;
  teamName: string;
  coins: number;
  completedStages: number;
  componentsRedeemed: number;
  status: string;
};

type Detail = {
  team: { coins: number; status: string; completedStages: number[] };
  purchases: { _id: string; cyberpunkName: string; dispatched: boolean }[];
  transactions: { _id: string; reason: string; amount: number }[];
  stageStates: { hintsRevealed: number[] }[];
};

export default function Admin() {
  const [rows, setRows] = useState<Team[]>([]);
  const [selected, setSelected] = useState<Team | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [resetting, setResetting] = useState(false);
  const router = useRouter();

  async function load() {
    const r = await fetch("/api/admin/leaderboard");
    if (r.status === 401) {
      router.push("/admin/login");
      return;
    }
    setRows((await r.json()).leaderboard || []);
  }

  async function select(t: Team) {
    setSelected(t);
    const r = await fetch(`/api/admin/team/${t._id}`);
    setDetail(await r.json());
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  async function override(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    await fetch("/api/admin/override", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamId: selected._id,
        amount: Number(amount),
        reason,
      }),
    });
    setAmount("");
    setReason("");
    load();
    select(selected);
  }

  async function resetTeam() {
    if (!selected) return;
    if (
      !window.confirm(
        `Reset ${selected.teamName} to zero progress? This clears coins, stages, and redeem history.`,
      )
    )
      return;
    setResetting(true);
    const r = await fetch("/api/admin/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamId: selected._id,
        reason: "Manual team reset by admin",
      }),
    });
    setResetting(false);
    if (r.ok) {
      load();
      select(selected);
    }
  }

  return (
    <>
      <header className="border-b border-line py-[22px] max-[760px]:py-4 w-full print:hidden">
        <div className="w-[min(1180px,calc(100%-40px))] max-[760px]:w-[min(calc(100%-28px),620px)] mx-auto flex flex-row items-center justify-between gap-5 max-[760px]:gap-3">
          <a className="font-bold tracking-[.08em] no-underline" href="/">
            IOTRICITY <span className="text-acid">// CONTROL</span>
          </a>
          <nav className="flex flex-row items-center gap-5 max-[760px]:gap-2.5 text-muted text-xs">
            <a href="/admin/dispatch" className="hover:text-paper transition">
              Dispatch queue
            </a>
            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                router.push("/admin/login");
              }}
              className="hover:text-paper cursor-pointer transition"
            >
              Disconnect
            </button>
          </nav>
        </div>
      </header>
      <main className="py-[42px] pb-[70px] max-[760px]:pt-[28px] w-[min(1180px,calc(100%-40px))] max-[760px]:w-[min(calc(100%-28px),620px)] mx-auto">
        <div className="mb-[28px]">
          <p className="text-acid text-[11px] tracking-[.16em] uppercase">ORGANIZER CONSOLE / AUTO-SYNC 5S</p>
          <h1 className="text-[42px] mt-[12px] mb-0 font-bold">Live field status</h1>
        </div>
        <div className="grid grid-cols-[1.4fr_0.8fr] max-[760px]:grid-cols-1 gap-5">
          <section className="border border-line bg-[#101313]/78 p-6 print:border-[#aaa] overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border-b border-line p-3.5 px-2.5 text-left whitespace-nowrap text-muted text-[10px] tracking-[.1em] uppercase">
                    #
                  </th>
                  <th className="border-b border-line p-3.5 px-2.5 text-left whitespace-nowrap text-muted text-[10px] tracking-[.1em] uppercase">
                    Team
                  </th>
                  <th className="border-b border-line p-3.5 px-2.5 text-left whitespace-nowrap text-muted text-[10px] tracking-[.1em] uppercase">
                    Stages
                  </th>
                  <th className="border-b border-line p-3.5 px-2.5 text-left whitespace-nowrap text-muted text-[10px] tracking-[.1em] uppercase">
                    Credits
                  </th>
                  <th className="border-b border-line p-3.5 px-2.5 text-left whitespace-nowrap text-muted text-[10px] tracking-[.1em] uppercase">
                    Parts
                  </th>
                  <th className="border-b border-line p-3.5 px-2.5 text-left whitespace-nowrap text-muted text-[10px] tracking-[.1em] uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr
                    key={t._id}
                    onClick={() => select(t)}
                    className={`cursor-pointer transition ${
                      selected?._id === t._id ? "bg-[#26332b]" : "hover:bg-white/5"
                    }`}
                  >
                    <td className="border-b border-line p-3.5 px-2.5 text-left whitespace-nowrap">
                      {String(t.rank).padStart(2, "0")}
                    </td>
                    <td className="border-b border-line p-3.5 px-2.5 text-left whitespace-nowrap">{t.teamName}</td>
                    <td className="border-b border-line p-3.5 px-2.5 text-left whitespace-nowrap">
                      {t.completedStages}/5
                    </td>
                    <td className="border-b border-line p-3.5 px-2.5 text-left whitespace-nowrap">{t.coins} BC</td>
                    <td className="border-b border-line p-3.5 px-2.5 text-left whitespace-nowrap">
                      {t.componentsRedeemed}/4
                    </td>
                    <td className="border-b border-line p-3.5 px-2.5 text-left whitespace-nowrap text-acid text-[11px] uppercase font-bold">
                      {t.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <aside>
            {!selected ? (
              <div className="border border-line bg-[#101313]/78 p-6">
                <p className="text-muted">Select a team to inspect its run.</p>
              </div>
            ) : (
              <div className="border border-line bg-[#101313]/78 p-6">
                <p className="text-acid text-[11px] tracking-[.16em] uppercase">TEAM DETAIL</p>
                <h2 className="text-[27px] mt-[12px] mb-[24px] font-bold">{selected.teamName}</h2>
                <div className="grid grid-cols-2 gap-3 mb-[24px]">
                  <div className="border-t-2 border-acid pt-[12px]">
                    <span className="text-muted text-xs block">CREDITS</span>
                    <strong className="block text-[30px] mt-[7px] font-bold">
                      {detail?.team.coins ?? selected.coins}
                    </strong>
                  </div>
                  <div className="border-t-2 border-acid pt-[12px]">
                    <span className="text-muted text-xs block">STAGES</span>
                    <strong className="block text-[30px] mt-[7px] font-bold">
                      {detail?.team.completedStages.length ?? selected.completedStages}/5
                    </strong>
                  </div>
                </div>
                <p className="text-acid text-[11px] tracking-[.16em] uppercase">REDEEMED MODULES</p>
                {(detail?.purchases || []).map((p) => (
                  <p key={p._id} className="border-b border-line py-[10px] text-xs flex justify-between">
                    {p.cyberpunkName}
                    <span className="text-acid text-[11px] uppercase font-bold">
                      {p.dispatched ? "DONE" : "PENDING"}
                    </span>
                  </p>
                ))}
                <p className="text-acid text-[11px] tracking-[.16em] uppercase mt-6">MANUAL CREDIT OVERRIDE</p>
                <form onSubmit={override} className="mt-3">
                  <input
                    className="w-full border border-line bg-[#151c19] text-paper p-3.5 outline-none focus:border-acid"
                    type="number"
                    placeholder="+/- amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                  <input
                    className="w-full border border-line bg-[#151c19] text-paper p-3.5 outline-none focus:border-acid mt-2"
                    placeholder="Reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <button className="border border-acid bg-acid text-ink px-4 py-3 font-bold no-underline inline-block hover:bg-[#efffa8] cursor-pointer mt-2 w-full transition">
                    APPLY
                  </button>
                </form>
                <p className="text-acid text-[11px] tracking-[.16em] uppercase mt-6">TEAM RESET</p>
                <button
                  type="button"
                  className="border border-line bg-transparent text-paper px-4 py-3 font-bold no-underline inline-block hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer mt-2 w-full transition"
                  onClick={resetTeam}
                  disabled={resetting}
                >
                  {resetting ? "RESETTING..." : "START TEAM FROM 0"}
                </button>
              </div>
            )}
          </aside>
        </div>
      </main>
    </>
  );
}