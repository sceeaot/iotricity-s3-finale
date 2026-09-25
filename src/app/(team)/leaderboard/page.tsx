"use client";

import { useEffect, useState } from "react";

type Row = {
  rank: number;
  teamName: string;
  coins: number;
  stagesCompleted: number;
  componentsRedeemed: number;
};

export default function Leaderboard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [updated, setUpdated] = useState("");

  async function load() {
    const res = await fetch("/api/leaderboard");
    const data = await res.json();
    setRows(data.leaderboard || []);
    setUpdated(new Date().toLocaleTimeString());
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <header className="border-b border-line py-[22px] max-[760px]:py-4 w-full print:hidden">
        <div className="w-[min(1180px,calc(100%-40px))] max-[760px]:w-[min(calc(100%-28px),620px)] mx-auto flex flex-row items-center justify-between gap-5 max-[760px]:gap-3">
          <a className="font-bold tracking-[.08em] no-underline" href="/">
            IOTRICITY <span className="text-acid">// RANKINGS</span>
          </a>
          <nav className="flex flex-row items-center gap-5 max-[760px]:gap-2.5 text-muted text-xs">
            <a href="/dashboard" className="hover:text-paper transition">
              Console
            </a>
            <a href="/shop" className="hover:text-paper transition">
              Shop
            </a>
          </nav>
        </div>
      </header>
      <main className="py-[42px] pb-[70px] max-[760px]:pt-[28px] w-[min(1180px,calc(100%-40px))] max-[760px]:w-[min(calc(100%-28px),620px)] mx-auto animate-rise">
        <div className="flex justify-between items-end mb-[28px]">
          <div>
            <p className="text-acid text-[11px] tracking-[.16em] uppercase">PUBLIC SIGNAL / LIVE</p>
            <h1 className="text-[42px] mt-[12px] mb-0 font-bold">Leaderboard</h1>
          </div>
          <span className="text-muted text-[11px]">UPDATED {updated}</span>
        </div>
        <div className="border border-line bg-[#101313]/78 p-6 print:border-[#aaa] overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border-b border-line p-3.5 px-2.5 text-left whitespace-nowrap text-muted text-[10px] tracking-[.1em] uppercase">
                  Rank
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
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.rank}>
                  <td
                    className={`border-b border-line p-3.5 px-2.5 text-left whitespace-nowrap ${
                      row.rank <= 3 ? "text-acid text-[20px]" : "text-muted text-[14px]"
                    }`}
                  >
                    {String(row.rank).padStart(2, "0")}
                  </td>
                  <td
                    className={`border-b border-line p-3.5 px-2.5 text-left whitespace-nowrap ${
                      row.rank <= 3 ? "font-bold" : "font-normal"
                    }`}
                  >
                    {row.teamName}
                  </td>
                  <td className="border-b border-line p-3.5 px-2.5 text-left whitespace-nowrap">
                    {row.stagesCompleted}/5
                  </td>
                  <td className="border-b border-line p-3.5 px-2.5 text-left whitespace-nowrap">
                    {row.coins} BC
                  </td>
                  <td className="border-b border-line p-3.5 px-2.5 text-left whitespace-nowrap">
                    {row.componentsRedeemed}/4
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <p className="text-muted py-[25px]">No teams have connected yet.</p>}
        </div>
      </main>
    </>
  );
}