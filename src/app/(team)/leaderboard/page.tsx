"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { Search } from "lucide-react";

type Row = {
  rank: number;
  teamName: string;
  coins: number;
  stagesCompleted: number;
  componentsRedeemed: number;
  status?: string;
};

function CornerMarks({ size = 9 }: { size?: number }) {
  return (
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-[1px] -top-[1px] border-l-2 border-t-2 border-white/80"
        style={{ width: size, height: size }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-[1px] -top-[1px] border-r-2 border-t-2 border-white/80"
        style={{ width: size, height: size }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[1px] -left-[1px] border-b-2 border-l-2 border-white/80"
        style={{ width: size, height: size }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[1px] -right-[1px] border-b-2 border-r-2 border-white/80"
        style={{ width: size, height: size }}
      />
    </>
  );
}

export default function Leaderboard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [updated, setUpdated] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/leaderboard");
      if (res.ok) {
        const data = await res.json();
        setRows(data.leaderboard || []);
        setUpdated(new Date().toLocaleTimeString());
      }
    } catch (e) {
      console.error("Leaderboard load failed:", e);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter((r) => r.teamName.toLowerCase().includes(q));
  }, [rows, searchQuery]);

  return (
    <div className="relative isolate min-h-screen bg-[#030713] text-white overflow-x-hidden">
      {/* Background matching dashboard */}
      <Image
        src="/bg.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-center fixed pointer-events-none"
      />
      <div aria-hidden="true" className="fixed inset-0 -z-10 bg-[#020611]/75 pointer-events-none" />

      {/* Header design identical to dashboard/page.tsx, with no shop button */}
      <header className="w-full border-b border-white/10 px-4 py-4 sm:px-10 sm:py-5">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-3">
          <a href="/" className="transition hover:opacity-85 shrink-0">
            <Image
              src="/dashboard_logo.png"
              alt="SCEE x IOTRICITY"
              width={160}
              height={28}
              className="h-5 sm:h-7 w-auto object-contain"
              priority
            />
          </a>
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="/dashboard"
              className="flex items-center justify-center gap-1.5 sm:gap-2 bg-white px-3 sm:px-5 py-2 sm:py-2.5 text-[10px] sm:text-xs font-bold tracking-wider uppercase text-[#080d19] transition hover:bg-white/85 active:scale-95 shadow-sm"
              title="Return to Stage Console"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0"
              >
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              <span>STAGE CONSOLE</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="mx-auto max-w-[1320px] px-4 py-8 sm:px-10 sm:py-10 space-y-6">
        {/* Title bar */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono tracking-[0.16em] uppercase text-white/50">
              <span className="w-2 h-2 rounded-full bg-white/70 animate-pulse" />
              <span>LIVE</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-display mt-2 tracking-tight">
              Leaderboard
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              <input
                type="text"
                placeholder="Search team name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-white/20 bg-black/30 text-white placeholder-white/40 font-mono text-xs outline-none focus:border-white/60 transition"
              />
            </div>
            {updated && (
              <span className="text-[11px] font-mono text-white/40 shrink-0 hidden sm:inline">
                UPDATED {updated}
              </span>
            )}
          </div>
        </div>

        {/* Leaderboard Table Container */}
        <div className="relative border border-white/15 bg-black/25 backdrop-blur-md overflow-hidden">
          <CornerMarks size={10} />

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-[10px] uppercase tracking-[0.14em] text-white/60">
                  <th className="py-3.5 px-4 w-16 text-center">RANK</th>
                  <th className="py-3.5 px-4">TEAM</th>
                  <th className="py-3.5 px-4">STAGES CLEARED</th>
                  <th className="py-3.5 px-4 text-right">CREDITS</th>
                  <th className="py-3.5 px-4 text-center">PARTS CLAIMED</th>
                  <th className="py-3.5 px-4 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredRows.map((row) => (
                  <tr
                    key={row.rank}
                    className="hover:bg-white/5 transition-colors duration-150"
                  >
                    {/* Rank */}
                    <td className="py-4 px-4 text-center">
                      <span className="inline-block font-mono font-bold text-xs px-2 py-0.5 border border-white/20 bg-white/5 text-white">
                        {String(row.rank).padStart(2, "0")}
                      </span>
                    </td>

                    {/* Team Name */}
                    <td className="py-4 px-4">
                      <span className="font-sans font-bold text-white text-sm">
                        {row.teamName}
                      </span>
                    </td>

                    {/* Stages Cleared (segmented monochrome blocks) */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((stg) => {
                          const isCleared = stg <= row.stagesCompleted;
                          return (
                            <div
                              key={stg}
                              title={`Stage ${stg}: ${isCleared ? "Cleared" : "Pending"}`}
                              className={`h-2.5 w-4 rounded-xs border transition-colors ${
                                isCleared
                                  ? "bg-white border-white"
                                  : "bg-transparent border-white/25"
                              }`}
                            />
                          );
                        })}
                        <span className="ml-1.5 text-[11px] text-white/50">
                          {row.stagesCompleted}/5
                        </span>
                      </div>
                    </td>

                    {/* Credits */}
                    <td className="py-4 px-4 text-right font-bold text-white text-sm">
                      {row.coins} <span className="text-[10px] font-normal text-white/50">BC</span>
                    </td>

                    {/* Parts Claimed */}
                    <td className="py-4 px-4 text-center">
                      <span className="px-2 py-0.5 border border-white/20 bg-black/40 text-[11px] text-white/80">
                        {row.componentsRedeemed}/4
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 text-center">
                      <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-xs border border-white/20 bg-white/5 text-white/80">
                        {row.status === "completed" || row.stagesCompleted >= 5
                          ? "COMPLETED"
                          : row.status || "WAITING"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRows.length === 0 && (
            <div className="p-12 text-center font-mono text-white/50 text-xs">
              <p>No teams found matching current search.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}