"use client";

import { useState } from "react";
import { Play, Pause, RotateCcw, Clock, Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import { useEventTimer } from "@/lib/useEventTimer";

function CornerMarks({ size = 8 }: { size?: number }) {
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

export default function AdminTimerControl() {
  const { status, remainingSeconds, durationSeconds, formatted, sync } = useEventTimer();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  async function handleAction(action: "start" | "pause" | "resume" | "reset" | "adjust", payload: { addSeconds?: number } = {}) {
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/timer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update timer state.");
      } else {
        await sync();
        let msg = "";
        if (action === "start") msg = "3-Hour Event Timer initiated successfully.";
        else if (action === "pause") msg = "Event Timer paused.";
        else if (action === "resume") msg = "Event Timer resumed.";
        else if (action === "reset") msg = "Event Timer reset back to 3 hours standby.";
        else if (action === "adjust") msg = `Timer adjusted by ${((payload.addSeconds || 0) / 60)} minutes.`;

        setSuccess(msg);
        setTimeout(() => setSuccess(""), 4000);
      }
    } catch {
      setError("Network error while updating timer.");
    } finally {
      setBusy(false);
      setShowResetConfirm(false);
    }
  }

  const safeDuration = durationSeconds > 0 ? durationSeconds : 3 * 3600;
  const progressPercent = Math.min(100, Math.max(0, ((safeDuration - remainingSeconds) / safeDuration) * 100));

  let statusBadgeColor = "border-cyan/40 bg-cyan/10 text-cyan";
  let statusText = "STANDBY // READY TO START";
  let statusGlow = "shadow-[0_0_15px_rgba(0,229,255,0.08)]";

  if (status === "running") {
    statusBadgeColor = "border-emerald-500/40 bg-emerald-500/10 text-emerald-400";
    statusText = "LIVE // COUNTDOWN ACTIVE";
    statusGlow = "shadow-[0_0_20px_rgba(16,185,129,0.12)]";
  } else if (status === "paused") {
    statusBadgeColor = "border-amber-500/40 bg-amber-500/10 text-amber-300";
    statusText = "HOLD // COUNTDOWN PAUSED";
    statusGlow = "shadow-[0_0_20px_rgba(245,158,11,0.15)]";
  } else if (status === "expired") {
    statusBadgeColor = "border-red-500/40 bg-red-500/10 text-red-400";
    statusText = "EXPIRED // TIME LIMIT REACHED";
    statusGlow = "shadow-[0_0_20px_rgba(239,68,68,0.15)]";
  }

  return (
    <div className={`relative border border-line bg-[#080d1a]/95 p-5 sm:p-6 backdrop-blur-md transition-all ${statusGlow}`}>
      <CornerMarks size={10} />

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Left: Info & Big Display */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted">
              <Clock className="w-3.5 h-3.5 text-cyan" />
              <span>OFFICIAL EVENT TIMER (3 HOURS)</span>
            </span>

            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-mono font-bold tracking-wider border rounded-xs ${statusBadgeColor}`}>
              <span className={`w-2 h-2 rounded-full ${status === "running" ? "bg-emerald-400 animate-pulse" : status === "paused" ? "bg-amber-400 animate-pulse" : status === "expired" ? "bg-red-400" : "bg-cyan"}`} />
              <span>{statusText}</span>
            </span>
          </div>

          <div className="flex items-baseline gap-4">
            <h2 className={`font-mono text-3xl sm:text-5xl font-bold tracking-wider tabular-nums ${
              status === "paused"
                ? "text-amber-300"
                : status === "expired"
                ? "text-red-400"
                : status === "running"
                ? "text-white drop-shadow-[0_0_12px_rgba(0,229,255,0.4)]"
                : "text-white/80"
            }`}>
              {formatted}
            </h2>
            <span className="text-xs font-mono text-muted/70">
              {status === "running" ? "Counting down in sync with all squads" : status === "paused" ? "Timer frozen for all squads" : "3-hour countdown not yet triggered"}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-md pt-1">
            <div className="flex justify-between text-[10px] font-mono text-muted mb-1">
              <span>ELAPSED: {Math.round(progressPercent)}%</span>
              <span>TOTAL DURATION: 03H 00M 00S</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  status === "paused"
                    ? "bg-amber-400"
                    : status === "expired"
                    ? "bg-red-500"
                    : "bg-cyan shadow-[0_0_10px_rgba(0,229,255,0.8)]"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex flex-col items-start lg:items-end gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {/* Start Timer Button (when idle) */}
            {status === "idle" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => handleAction("start")}
                className="px-4 py-2.5 bg-cyan hover:bg-cyan/90 text-black font-mono font-bold text-xs tracking-wider flex items-center gap-2 transition active:scale-95 shadow-[0_0_16px_rgba(0,229,255,0.35)] cursor-pointer disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>TURN TIMER ON (START 3H)</span>
              </button>
            )}

            {/* Pause Timer Button (when running) */}
            {status === "running" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => handleAction("pause")}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs tracking-wider flex items-center gap-2 transition active:scale-95 shadow-[0_0_16px_rgba(245,158,11,0.3)] cursor-pointer disabled:opacity-50"
              >
                <Pause className="w-4 h-4 fill-current" />
                <span>PAUSE TIMER</span>
              </button>
            )}

            {/* Resume Timer Button (when paused) */}
            {status === "paused" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => handleAction("resume")}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs tracking-wider flex items-center gap-2 transition active:scale-95 shadow-[0_0_16px_rgba(16,185,129,0.3)] cursor-pointer disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>RESUME TIMER</span>
              </button>
            )}

            {/* Quick Adjust Buttons (+5m, +15m) when running or paused */}
            {(status === "running" || status === "paused") && (
              <div className="flex items-center gap-1 border border-line bg-[#040812] p-1 font-mono text-xs">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleAction("adjust", { addSeconds: 300 })}
                  className="px-2 py-1 text-muted hover:text-cyan hover:bg-white/5 transition flex items-center gap-0.5 cursor-pointer disabled:opacity-50"
                  title="Add 5 minutes"
                >
                  <Plus className="w-3 h-3" />
                  <span>5M</span>
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleAction("adjust", { addSeconds: 900 })}
                  className="px-2 py-1 text-muted hover:text-cyan hover:bg-white/5 transition flex items-center gap-0.5 cursor-pointer disabled:opacity-50"
                  title="Add 15 minutes"
                >
                  <Plus className="w-3 h-3" />
                  <span>15M</span>
                </button>
              </div>
            )}

            {/* Reset Button */}
            {status !== "idle" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => setShowResetConfirm(true)}
                className="px-3 py-2 border border-line hover:border-red-500/40 bg-transparent hover:bg-red-500/10 text-muted hover:text-red-300 font-mono text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                title="Reset timer back to 3 hours standby"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RESET (3H)</span>
              </button>
            )}
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="flex items-center gap-1.5 text-xs text-red-400 font-mono">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{success}</span>
            </div>
          )}
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-rise">
          <div className="relative w-full max-w-md border border-amber-500/50 bg-[#080d1a] p-6 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
            <CornerMarks size={10} />
            <div className="flex items-center gap-2 text-amber-400 mb-3 font-mono text-sm font-bold">
              <AlertCircle className="w-5 h-5" />
              <span>RESET TIMER CONFIRMATION</span>
            </div>
            <p className="text-sm font-sans text-white/80 mb-6 leading-relaxed">
              Are you sure you want to reset the event timer back to <strong className="text-white">03:00:00 standby</strong>?
              This will stop the countdown and set the timer back to its initial state for all participants.
            </p>
            <div className="flex items-center justify-end gap-3 font-mono text-xs">
              <button
                type="button"
                disabled={busy}
                onClick={() => setShowResetConfirm(false)}
                className="px-3.5 py-2 border border-line bg-transparent hover:bg-white/5 text-muted hover:text-white transition cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleAction("reset")}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold transition flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.4)]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>CONFIRM RESET (3H)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
