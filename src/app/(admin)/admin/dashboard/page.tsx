"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Trophy,
  Package,
  Layers,
  Search,
  RefreshCw,
  LogOut,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Shield,
  Coins,
  Radio,
  X,
  History,
  Edit3,
} from "lucide-react";
import AdminTimerControl from "@/components/AdminTimerControl";

type Team = {
  _id: string;
  teamCode?: string;
  rank: number;
  teamName: string;
  coins: number;
  completedStages: number;
  currentStage?: number;
  componentsRedeemed: number;
  status: string;
  startTime?: string | null;
};

type Detail = {
  team: { _id?: string; teamCode?: string; teamName?: string; coins: number; status: string; completedStages: number[]; currentStage?: number };
  purchases: { _id: string; componentName?: string; cyberpunkName?: string; dispatched: boolean; pricePaid?: number }[];
  transactions: { _id: string; reason: string; amount: number; type?: string; timestamp?: string }[];
  stageStates: { stageNumber?: number; hintsRevealed?: number[] }[];
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

export default function AdminDashboard() {
  const [rows, setRows] = useState<Team[]>([]);
  const [selected, setSelected] = useState<Team | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [overrideBusy, setOverrideBusy] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "waiting" | "completed">("all");
  const [pendingDispatchesCount, setPendingDispatchesCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [renameBusy, setRenameBusy] = useState(false);
  const [renameError, setRenameError] = useState("");
  const [renameSuccess, setRenameSuccess] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [showNukeModal, setShowNukeModal] = useState(false);
  const [nukeConfirmText, setNukeConfirmText] = useState("");
  const [nukeBusy, setNukeBusy] = useState(false);
  const [nukeError, setNukeError] = useState("");
  const [nukeSuccess, setNukeSuccess] = useState("");
  const router = useRouter();

  async function loadData() {
    try {
      const [rLeaderboard, rDispatch] = await Promise.all([
        fetch("/api/admin/leaderboard"),
        fetch("/api/admin/dispatch"),
      ]);

      if (rLeaderboard.status === 401) {
        router.push("/admin/login");
        return;
      }

      if (rLeaderboard.ok) {
        const data = await rLeaderboard.json();
        setRows(data.leaderboard || []);
        setLastSyncTime(new Date().toLocaleTimeString());
      }

      if (rDispatch.ok) {
        const dData = await rDispatch.json();
        const pending = (dData.purchases || []).filter((p: { dispatched: boolean }) => !p.dispatched).length;
        setPendingDispatchesCount(pending);
      }
    } catch (e) {
      console.error("Sync error:", e);
    }
  }

  async function select(t: Team) {
    setSelected(t);
    setNewTeamName(t.teamName);
    setRenameError("");
    setRenameSuccess("");
    setIsEditingName(false);
    setLoadingDetail(true);
    try {
      const r = await fetch(`/api/admin/team/${t._id}`);
      if (r.ok) {
        const d = await r.json();
        setDetail(d);
      }
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const trimmed = newTeamName.trim();
    if (!trimmed) {
      setRenameError("Callsign cannot be empty.");
      return;
    }
    if (trimmed === selected.teamName) {
      setIsEditingName(false);
      return;
    }
    setRenameBusy(true);
    setRenameError("");
    setRenameSuccess("");
    try {
      const res = await fetch("/api/admin/rename-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: selected._id,
          newTeamName: trimmed,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRenameError(data.error || "Failed to rename team.");
        return;
      }
      setSelected({ ...selected, teamName: trimmed });
      setRows((prev) =>
        prev.map((r) => (r._id === selected._id ? { ...r, teamName: trimmed } : r))
      );
      setIsEditingName(false);
      setRenameSuccess("Squad callsign successfully updated.");
      setTimeout(() => setRenameSuccess(""), 4000);
      loadData();
    } catch {
      setRenameError("Network error while updating team callsign.");
    } finally {
      setRenameBusy(false);
    }
  }

  useEffect(() => {
    loadData();
    const id = setInterval(loadData, 5000);
    return () => clearInterval(id);
  }, []);

  async function override(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !amount) return;
    setOverrideBusy(true);
    try {
      await fetch("/api/admin/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: selected._id,
          amount: Number(amount),
          reason: reason.trim() || "Manual organizer adjustment",
        }),
      });
      setAmount("");
      setReason("");
      await loadData();
      await select(selected);
    } finally {
      setOverrideBusy(false);
    }
  }

  async function resetTeam() {
    if (!selected) return;
    setResetting(true);
    try {
      const r = await fetch("/api/admin/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: selected._id,
          reason: "Manual team reset by organizer",
        }),
      });
      if (r.ok) {
        setShowResetConfirm(false);
        await loadData();
        await select(selected);
      }
    } finally {
      setResetting(false);
    }
  }

  async function handleNukeEvent() {
    if (nukeConfirmText.trim().toUpperCase() !== "NUKE") return;
    setNukeBusy(true);
    setNukeError("");
    setNukeSuccess("");
    try {
      const res = await fetch("/api/admin/nuke-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) {
        setNukeError(data.error || "Failed to execute global event restart.");
        return;
      }
      setNukeSuccess(data.message || "Global event restart complete: all team progress wiped cleanly.");
      setSelected(null);
      setDetail(null);
      await loadData();
      setTimeout(() => {
        setShowNukeModal(false);
        setNukeConfirmText("");
        setNukeSuccess("");
      }, 2500);
    } catch {
      setNukeError("Network error while attempting to execute global restart.");
    } finally {
      setNukeBusy(false);
    }
  }

  // Derived Metrics
  const stats = useMemo(() => {
    const totalTeams = rows.length;
    const activeTeams = rows.filter((r) => r.status === "active").length;
    const completedRuns = rows.filter((r) => r.completedStages >= 5 || r.status === "completed").length;
    const totalCreditsInCirculation = rows.reduce((acc, r) => acc + (r.coins || 0), 0);
    const totalPartsRedeemed = rows.reduce((acc, r) => acc + (r.componentsRedeemed || 0), 0);
    const topTeam = rows[0] || null;

    return {
      totalTeams,
      activeTeams,
      completedRuns,
      totalCreditsInCirculation,
      totalPartsRedeemed,
      topTeam,
    };
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((t) => {
      const matchSearch =
        t.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.teamCode && t.teamCode.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "completed"
          ? t.completedStages >= 5 || t.status === "completed"
          : t.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [rows, searchQuery, statusFilter]);

  return (
    <div className="min-h-screen bg-[#040711] text-paper selection:bg-cyan selection:text-ink">
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[300px] bg-cyan/5 blur-[140px] rounded-full" />
        <div className="absolute bottom-10 left-10 w-[450px] h-[350px] bg-blue-600/5 blur-[120px] rounded-full" />
      </div>

      {/* Top Mission Control Header */}
      <header className="sticky top-0 z-40 border-b border-line/80 bg-[#040711]/90 backdrop-blur-md">
        <div className="w-[min(1440px,calc(100%-40px))] mx-auto py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 group">
              <div className="p-1.5 border border-cyan/40 bg-cyan/10 text-cyan">
                <Shield className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm tracking-[0.1em] text-white">
                IOTRICITY <span className="text-cyan">// CONTROL ROOM</span>
              </span>
            </a>

            <div className="hidden sm:flex items-center gap-2 ml-4 px-2.5 py-1 border border-line bg-[#091020] text-[11px] font-mono text-cyan">
              <Radio className="w-3 h-3 text-cyan animate-pulse" />
              <span>LIVE TELEMETRY // 5S SYNC</span>
              {lastSyncTime && <span className="text-muted/70 text-[10px]">({lastSyncTime})</span>}
            </div>
          </div>

          <nav className="flex items-center gap-3 font-mono text-xs">
            <a
              href="/admin/dispatch"
              className="relative px-3 py-1.5 border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 flex items-center gap-2 transition"
            >
              <Package className="w-3.5 h-3.5" />
              <span>DISPATCH DESK</span>
              {pendingDispatchesCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500 text-black font-bold text-[10px] rounded-xs animate-pulse">
                  {pendingDispatchesCount} PENDING
                </span>
              )}
            </a>

            <a
              href="/leaderboard"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 border border-line bg-[#080e1d] hover:bg-white/5 text-muted hover:text-white flex items-center gap-1.5 transition"
            >
              <span>PUBLIC BOARD</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={() => {
                setShowNukeModal(true);
                setNukeConfirmText("");
                setNukeError("");
                setNukeSuccess("");
              }}
              className="px-3 py-1.5 border border-red-500/50 bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-red-100 flex items-center gap-1.5 transition cursor-pointer shadow-[0_0_12px_rgba(239,68,68,0.2)] hover:shadow-[0_0_18px_rgba(239,68,68,0.4)]"
              title="Restart event: Wipes all team progress and purchases while preserving questions and components"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span className="font-bold tracking-wider">RESTART EVENT (NUKE)</span>
            </button>

            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                router.push("/admin/login");
              }}
              className="px-3 py-1.5 border border-line bg-transparent hover:bg-red-500/10 hover:border-red-500/40 text-muted hover:text-red-400 flex items-center gap-1.5 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>DISCONNECT</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="w-[min(1440px,calc(100%-40px))] mx-auto py-6 sm:py-8 space-y-6">
        {/* Mission Timer Control Panel */}
        <AdminTimerControl />

        {/* KPI Telemetry Banner */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="relative border border-line bg-[#080d1a]/80 p-4 backdrop-blur-xs">
            <CornerMarks size={8} />
            <div className="flex items-center justify-between text-muted text-[11px] font-mono uppercase tracking-wider mb-2">
              <span>SQUAD POOL</span>
              <Users className="w-4 h-4 text-cyan" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-display text-white">{stats.totalTeams}</span>
              <span className="text-xs font-mono text-cyan">{stats.activeTeams} ACTIVE RUNS</span>
            </div>
          </div>

          <div className="relative border border-line bg-[#080d1a]/80 p-4 backdrop-blur-xs">
            <CornerMarks size={8} />
            <div className="flex items-center justify-between text-muted text-[11px] font-mono uppercase tracking-wider mb-2">
              <span>APEX SQUAD (#1)</span>
              <Trophy className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="truncate">
              <span className="text-xl sm:text-2xl font-bold font-display text-white truncate block">
                {stats.topTeam?.teamName || "N/A"}
              </span>
              <span className="text-xs font-mono text-muted">
                {stats.topTeam ? `${stats.topTeam.coins} BC • ${stats.topTeam.completedStages}/5 STAGES` : "No scores yet"}
              </span>
            </div>
          </div>

          <div className="relative border border-line bg-[#080d1a]/80 p-4 backdrop-blur-xs">
            <CornerMarks size={8} />
            <div className="flex items-center justify-between text-muted text-[11px] font-mono uppercase tracking-wider mb-2">
              <span>CREDITS CIRCULATING</span>
              <Coins className="w-4 h-4 text-cyan" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-display text-white">
                {stats.totalCreditsInCirculation.toLocaleString()}
              </span>
              <span className="text-xs font-mono text-muted">BC TOTAL</span>
            </div>
          </div>

          <div className="relative border border-line bg-[#080d1a]/80 p-4 backdrop-blur-xs">
            <CornerMarks size={8} />
            <div className="flex items-center justify-between text-muted text-[11px] font-mono uppercase tracking-wider mb-2">
              <span>HARDWARE DISPATCHES</span>
              <Package className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-display text-white">{stats.totalPartsRedeemed}</span>
              <span className="text-xs font-mono text-amber-300">
                {pendingDispatchesCount > 0 ? `${pendingDispatchesCount} PENDING HANDOFF` : "ALL DISPATCHED"}
              </span>
            </div>
          </div>
        </section>

        {/* Main Grid: Squad Matrix (Left) & Tactical Inspector (Right) */}
        <section className="grid grid-cols-1 xl:grid-cols-[1.55fr_1fr] gap-6 items-start">
          {/* SQUAD MATRIX (TABLE) */}
          <div className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter squads by callsign or team code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#090f1d] border border-line text-xs font-mono text-white placeholder-muted/50 outline-none focus:border-cyan"
                />
              </div>

              {/* Status Tabs */}
              <div className="flex items-center gap-1 font-mono text-[11px] bg-[#070c18] border border-line p-1">
                {(["all", "active", "waiting", "completed"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 uppercase tracking-wider transition cursor-pointer ${
                      statusFilter === st
                        ? "bg-cyan text-[#040711] font-bold"
                        : "text-muted hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Matrix Card */}
            <div className="relative border border-line bg-[#080d1a]/85 backdrop-blur-md overflow-hidden">
              <CornerMarks size={10} />

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-line bg-[#0c1424] font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                      <th className="py-3 px-3.5 w-12 text-center">RANK</th>
                      <th className="py-3 px-3.5">SQUAD CALLSIGN / CODE</th>
                      <th className="py-3 px-3.5">STAGE PROGRESS</th>
                      <th className="py-3 px-3.5 text-right">CREDITS</th>
                      <th className="py-3 px-3.5 text-center">HARDWARE</th>
                      <th className="py-3 px-3.5 text-center">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60 font-mono text-xs">
                    {filteredRows.map((t) => {
                      const isSelected = selected?._id === t._id;
                      return (
                        <tr
                          key={t._id}
                          onClick={() => select(t)}
                          className={`cursor-pointer transition-colors duration-150 ${
                            isSelected
                              ? "bg-cyan/15 hover:bg-cyan/20 ring-1 ring-inset ring-cyan/50"
                              : "hover:bg-white/5"
                          }`}
                        >
                          <td className="py-3.5 px-3 text-center">
                            <span
                              className={`inline-block font-bold text-xs px-1.5 py-0.5 ${
                                t.rank === 1
                                  ? "bg-yellow-400/20 text-yellow-300 border border-yellow-400/40"
                                  : t.rank === 2
                                  ? "bg-slate-300/20 text-slate-200 border border-slate-300/40"
                                  : t.rank === 3
                                  ? "bg-amber-600/20 text-amber-300 border border-amber-600/40"
                                  : "text-muted"
                              }`}
                            >
                              #{String(t.rank).padStart(2, "0")}
                            </span>
                          </td>
                          <td className="py-3.5 px-3.5">
                            <div className="font-sans font-semibold text-white text-sm flex items-center gap-2">
                              <span>{t.teamName}</span>
                              {t.teamCode && (
                                <span className="font-mono text-[10px] font-bold text-cyan bg-cyan/10 px-1.5 py-0.5 border border-cyan/40 tracking-wider">
                                  {t.teamCode}
                                </span>
                              )}
                              {isSelected && <span className="text-[10px] font-mono text-cyan bg-cyan/10 px-1 border border-cyan/40">SELECTED</span>}
                            </div>
                            {t.startTime && (
                              <span className="text-[10px] text-muted font-mono block">
                                Started: {new Date(t.startTime).toLocaleTimeString()}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-3.5">
                            <div className="flex items-center gap-1.5">
                              {/* 5-segmented stage indicator */}
                              {[1, 2, 3, 4, 5].map((stg) => {
                                const isDone = stg <= t.completedStages;
                                const isCurrent = stg === (t.currentStage ?? t.completedStages + 1);
                                return (
                                  <div
                                    key={stg}
                                    title={`Stage ${stg}: ${isDone ? "Cleared" : isCurrent ? "Active" : "Locked"}`}
                                    className={`h-2.5 w-4 rounded-xs border transition-colors ${
                                      isDone
                                        ? "bg-cyan border-cyan"
                                        : isCurrent
                                        ? "bg-amber-400/40 border-amber-400 animate-pulse"
                                        : "bg-black/30 border-line"
                                    }`}
                                  />
                                );
                              })}
                              <span className="ml-1 text-[11px] text-muted">{t.completedStages}/5</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-3.5 text-right font-bold text-cyan text-sm">
                            {t.coins} <span className="text-[10px] font-normal text-muted">BC</span>
                          </td>
                          <td className="py-3.5 px-3.5 text-center">
                            <span className="px-2 py-0.5 border border-line bg-black/40 text-[11px] text-paper">
                              {t.componentsRedeemed}/4
                            </span>
                          </td>
                          <td className="py-3.5 px-3.5 text-center">
                            <span
                              className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-xs border ${
                                t.status === "active"
                                  ? "border-cyan/50 bg-cyan/10 text-cyan"
                                  : t.status === "completed"
                                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                                  : "border-slate-500/40 bg-slate-500/10 text-slate-400"
                              }`}
                            >
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredRows.length === 0 && (
                <div className="p-12 text-center font-mono text-muted text-xs space-y-2">
                  <p>No squad telemetry matched filter criteria.</p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                    }}
                    className="text-cyan underline hover:text-white"
                  >
                    Reset filters
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* SQUAD COMMAND INSPECTOR (RIGHT PANEL) */}
          <aside className="sticky top-20">
            {!selected ? (
              <div className="relative border border-line/80 bg-[#080d1a]/85 p-8 text-center space-y-3">
                <CornerMarks size={10} />
                <div className="w-12 h-12 mx-auto border border-line bg-[#0d1424] flex items-center justify-center text-muted">
                  <Sliders className="w-6 h-6 text-cyan/70" />
                </div>
                <h3 className="font-mono text-xs uppercase tracking-widest text-cyan">SQUAD TELEMETRY IDLE</h3>
                <p className="text-muted text-xs font-sans max-w-xs mx-auto leading-relaxed">
                  Select any row in the live squad matrix to inspect puzzle progression, audit transaction history, issue manual credit overrides, or reset progress.
                </p>
              </div>
            ) : (
              <div className="relative border border-cyan/40 bg-[#080d1a]/95 backdrop-blur-md p-6 space-y-6 shadow-2xl">
                <CornerMarks size={12} />

                {/* Squad Header Bar */}
                <div className="flex items-start justify-between border-b border-line pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-cyan bg-cyan/10 px-2 py-0.5 border border-cyan/30">
                        RANK #{selected.rank}
                      </span>
                      {selected.teamCode && (
                        <span className="font-mono text-[10px] uppercase tracking-widest text-amber-300 bg-amber-500/10 px-2 py-0.5 border border-amber-500/30">
                          CODE: {selected.teamCode}
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 border ${
                          selected.status === "active"
                            ? "border-cyan/50 text-cyan bg-cyan/5"
                            : selected.status === "completed"
                            ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/5"
                            : "border-slate-500/40 text-slate-400"
                        }`}
                      >
                        {selected.status}
                      </span>
                    </div>
                    {!isEditingName ? (
                      <div className="flex items-center gap-2 mt-1.5">
                        <h2 className="text-2xl font-bold font-display text-white">{selected.teamName}</h2>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingName(true);
                            setNewTeamName(selected.teamName);
                            setRenameError("");
                          }}
                          className="p-1 text-muted hover:text-cyan hover:bg-cyan/10 border border-transparent hover:border-cyan/30 rounded-xs transition cursor-pointer"
                          title="Rename squad callsign"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleRename} className="flex items-center gap-1.5 mt-1.5">
                        <input
                          type="text"
                          value={newTeamName}
                          onChange={(e) => setNewTeamName(e.target.value)}
                          required
                          minLength={2}
                          maxLength={50}
                          autoFocus
                          placeholder="New Callsign"
                          className="px-2 py-1 bg-[#0d1527] border border-cyan text-white font-mono text-xs outline-none w-44"
                        />
                        <button
                          type="submit"
                          disabled={renameBusy || !newTeamName.trim()}
                          className="px-2.5 py-1 bg-cyan text-[#040711] font-mono font-bold text-[11px] uppercase tracking-wider hover:bg-cyan/90 cursor-pointer disabled:opacity-50"
                        >
                          {renameBusy ? "..." : "SAVE"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingName(false);
                            setRenameError("");
                          }}
                          className="px-2 py-1 border border-line bg-black/40 text-muted hover:text-white font-mono text-[11px] cursor-pointer"
                        >
                          CANCEL
                        </button>
                      </form>
                    )}
                    {renameError && (
                      <p className="text-red-400 font-mono text-[10px] mt-1">{renameError}</p>
                    )}
                    {renameSuccess && (
                      <p className="text-emerald-400 font-mono text-[10px] mt-1">{renameSuccess}</p>
                    )}
                    {loadingDetail && (
                      <span className="text-[10px] font-mono text-cyan flex items-center gap-1 mt-1">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Fetching live telemetry...
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSelected(null);
                      setDetail(null);
                    }}
                    className="p-1 text-muted hover:text-white transition"
                    title="Close squad panel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Squad Balance & Stage Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#0d1527] border border-line">
                    <span className="text-[10px] font-mono text-muted uppercase tracking-wider block">
                      CURRENT CREDITS
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-bold font-display text-cyan">
                        {detail?.team.coins ?? selected.coins}
                      </span>
                      <span className="text-xs font-mono text-muted">BC</span>
                    </div>
                  </div>
                  <div className="p-3 bg-[#0d1527] border border-line">
                    <span className="text-[10px] font-mono text-muted uppercase tracking-wider block">
                      STAGES CLEARED
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-bold font-display text-white">
                        {detail?.team.completedStages?.length ?? selected.completedStages}
                      </span>
                      <span className="text-xs font-mono text-muted">/ 5</span>
                    </div>
                  </div>
                </div>

                {/* Stages Cleared Detail List */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-cyan block">
                    STAGE RUN PROGRESSION
                  </span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[1, 2, 3, 4, 5].map((stg) => {
                      const completed = (detail?.team.completedStages || []).includes(stg);
                      return (
                        <div
                          key={stg}
                          className={`p-2 text-center border font-mono ${
                            completed
                              ? "border-cyan/50 bg-cyan/15 text-cyan"
                              : "border-line bg-black/30 text-muted/60"
                          }`}
                        >
                          <div className="text-[9px] uppercase">STG {stg}</div>
                          <div className="text-xs font-bold mt-0.5">{completed ? "✓" : "—"}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Redeemed Components Section */}
                <div className="space-y-2 border-t border-line/60 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-cyan">
                      HARDWARE REDEMPTIONS ({detail?.purchases?.length || 0})
                    </span>
                    <a
                      href="/admin/dispatch"
                      className="text-[10px] font-mono text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <span>GO TO DISPATCH</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>

                  {(detail?.purchases || []).length === 0 ? (
                    <p className="text-xs font-mono text-muted/60 italic py-1">No hardware redeemed yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {detail?.purchases.map((p) => (
                        <div
                          key={p._id}
                          className="flex items-center justify-between p-2.5 bg-[#0b1222] border border-line text-xs font-mono"
                        >
                          <span className="text-white truncate max-w-[190px]">
                            {p.componentName || p.cyberpunkName || "Component"}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-xs ${
                              p.dispatched
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                            }`}
                          >
                            {p.dispatched ? "DISPATCHED" : "PENDING HANDOFF"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Transaction Log Audit */}
                {detail?.transactions && detail.transactions.length > 0 && (
                  <div className="space-y-2 border-t border-line/60 pt-4">
                    <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted flex items-center gap-1.5">
                      <History className="w-3 h-3 text-cyan" />
                      RECENT TRANSACTIONS ({detail.transactions.length})
                    </span>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 text-[11px] font-mono">
                      {detail.transactions.slice(0, 5).map((tx) => (
                        <div
                          key={tx._id}
                          className="flex items-center justify-between py-1 border-b border-line/40 text-muted"
                        >
                          <span className="truncate max-w-[200px] text-white/80">{tx.reason}</span>
                          <span
                            className={`font-bold shrink-0 ${
                              tx.amount >= 0 ? "text-emerald-400" : "text-red-400"
                            }`}
                          >
                            {tx.amount > 0 ? `+${tx.amount}` : tx.amount} BC
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Squad Callsign Reconfiguration */}
                <div className="space-y-2.5 border-t border-line/60 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-cyan block">
                      RENAME SQUAD CALLSIGN
                    </span>
                    <span className="text-[9px] font-mono text-muted/60">CODE: CONFIDENTIAL & PERMANENT</span>
                  </div>

                  <form onSubmit={handleRename} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter new squad callsign"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        required
                        minLength={2}
                        maxLength={50}
                        className="flex-1 px-3 py-2 bg-[#0d1527] border border-line text-white font-mono text-xs outline-none focus:border-cyan"
                      />
                      <button
                        type="submit"
                        disabled={renameBusy || !newTeamName.trim() || newTeamName.trim() === selected.teamName}
                        className="px-4 py-2 bg-cyan/90 hover:bg-cyan text-[#040711] font-mono font-bold text-xs uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
                      >
                        {renameBusy ? "SAVING..." : "UPDATE"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Manual Credit Override Tool */}
                <div className="space-y-3 border-t border-line/60 pt-4">
                  <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-cyan block">
                    MANUAL CREDIT OVERRIDE
                  </span>

                  <form onSubmit={override} className="space-y-2.5">
                    {/* Presets */}
                    <div className="grid grid-cols-4 gap-1.5 font-mono text-xs">
                      {["+50", "+100", "-50", "-100"].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setAmount(preset.replace("+", ""))}
                          className="py-1 border border-line bg-[#0d1424] hover:bg-cyan/20 hover:border-cyan text-muted hover:text-white transition cursor-pointer"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="+/- BC"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        className="w-28 px-3 py-2 bg-[#0d1527] border border-line text-white font-mono text-xs outline-none focus:border-cyan"
                      />
                      <input
                        type="text"
                        placeholder="Reason (e.g. Bonus, penalty, fix)"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="flex-1 px-3 py-2 bg-[#0d1527] border border-line text-white font-mono text-xs outline-none focus:border-cyan"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={overrideBusy}
                      className="w-full py-2.5 bg-cyan/90 hover:bg-cyan text-[#040711] font-mono font-bold text-xs uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
                    >
                      {overrideBusy ? "EXECUTING OVERRIDE..." : "APPLY CREDIT ADJUSTMENT"}
                    </button>
                  </form>
                </div>

                {/* Danger Zone: Team Reset */}
                <div className="border-t border-red-500/30 pt-4 space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-red-400 block">
                    DANGER ZONE // SQUAD RUN RESET
                  </span>

                  {!showResetConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(true)}
                      className="w-full py-2 border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-300 font-mono text-xs font-semibold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      <span>RESET SQUAD PROGRESS TO ZERO</span>
                    </button>
                  ) : (
                    <div className="p-3 border border-red-500/60 bg-red-950/40 space-y-2 font-mono text-xs animate-rise">
                      <p className="text-red-200 text-[11px] leading-snug">
                        Confirm reset for <strong>{selected.teamName}</strong>? All coins, solved stages, and redeemed hardware records will be wiped.
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={resetTeam}
                          disabled={resetting}
                          className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
                        >
                          {resetting ? "RESETTING..." : "CONFIRM WIPE"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowResetConfirm(false)}
                          className="px-3 py-1.5 border border-line bg-black/40 text-muted hover:text-white transition cursor-pointer"
                        >
                          CANCEL
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </aside>
        </section>
      </main>

      {/* Global Event Restart / Nuke Modal */}
      {showNukeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-lg border border-red-500/60 bg-[#090d18] p-6 sm:p-7 shadow-[0_0_50px_rgba(239,68,68,0.25)] space-y-5">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -left-[1px] -top-[1px] border-l-2 border-t-2 border-red-500 w-3 h-3"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-[1px] -top-[1px] border-r-2 border-t-2 border-red-500 w-3 h-3"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-[1px] -left-[1px] border-b-2 border-l-2 border-red-500 w-3 h-3"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-[1px] -right-[1px] border-b-2 border-r-2 border-red-500 w-3 h-3"
            />

            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-red-500/30 pb-3">
              <div className="flex items-center gap-2.5 text-red-400">
                <div className="p-1.5 border border-red-500/40 bg-red-950/60 text-red-400">
                  <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold font-display text-white text-base tracking-wide">
                    EVENT RESTART // NUKE ALL PROGRESS
                  </h3>
                  <span className="font-mono text-[10px] text-red-400 uppercase tracking-widest block">
                    HIGH-SEVERITY ADMINISTRATIVE OVERRIDE
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!nukeBusy) setShowNukeModal(false);
                }}
                className="p-1 text-muted hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Warnings */}
            <div className="space-y-3.5 text-xs font-mono">
              <div className="p-3 border border-red-500/40 bg-red-950/30 text-red-200 space-y-1.5 leading-relaxed">
                <p className="font-bold text-red-300 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  CONFIRMATION REQUIRED: GLOBAL TELEMETRY PURGE
                </p>
                <p className="text-[11px] text-red-200/90">
                  This operation resets the entire event state for <strong>all {rows.length} squads</strong> back to ground zero.
                </p>
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="text-muted uppercase tracking-wider text-[10px]">What will be wiped:</div>
                <ul className="space-y-1 text-slate-300">
                  <li className="flex items-center gap-2">
                    <span className="text-red-400">✕</span> All squad Breach Credits reset to 0 BC
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-400">✕</span> All puzzle stage progression reset to Stage 1 (locks re-engaged)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-400">✕</span> All component hardware purchases wiped from squad inventories
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-400">✕</span> All audit transactions and run stopwatches cleared
                  </li>
                </ul>

                <div className="text-emerald-400 uppercase tracking-wider text-[10px] pt-1">What remains untouched:</div>
                <ul className="space-y-1 text-slate-400">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> Squad accounts, callsigns, passcodes & path assignments
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> Build problem statements & objectives (zero modifications)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> Puzzle questions, keys & solutions (zero modifications)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> Hardware component catalog & specs (zero modifications)
                  </li>
                </ul>
              </div>

              {nukeError && (
                <div className="p-2.5 border border-red-500 bg-red-950/70 text-red-200 text-xs">
                  {nukeError}
                </div>
              )}

              {nukeSuccess && (
                <div className="p-2.5 border border-emerald-500 bg-emerald-950/70 text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{nukeSuccess}</span>
                </div>
              )}

              {/* Input validation safeguard */}
              {!nukeSuccess && (
                <div className="space-y-2 pt-2 border-t border-line">
                  <label className="block text-[11px] text-muted">
                    Type <span className="font-bold text-red-400">NUKE</span> to unlock the purge protocol:
                  </label>
                  <input
                    type="text"
                    value={nukeConfirmText}
                    onChange={(e) => setNukeConfirmText(e.target.value)}
                    placeholder="Type NUKE to confirm"
                    disabled={nukeBusy}
                    className="w-full px-3 py-2 bg-[#060a14] border border-red-500/50 text-white font-mono text-xs uppercase tracking-widest placeholder:text-muted/40 outline-none focus:border-red-400"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 pt-2 border-t border-line/60">
              <button
                type="button"
                onClick={() => setShowNukeModal(false)}
                disabled={nukeBusy}
                className="flex-1 py-2 border border-line bg-black/40 hover:bg-white/5 text-muted hover:text-white font-mono text-xs uppercase transition cursor-pointer disabled:opacity-50"
              >
                ABORT
              </button>
              <button
                type="button"
                onClick={handleNukeEvent}
                disabled={nukeConfirmText.trim().toUpperCase() !== "NUKE" || nukeBusy}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 disabled:bg-red-950/40 disabled:text-red-500/40 disabled:border-red-900/30 border border-red-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.3)] flex items-center justify-center gap-2"
              >
                {nukeBusy ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>PURGING TELEMETRY...</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>EXECUTE GLOBAL NUKE</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}