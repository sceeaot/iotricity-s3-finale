"use client";

import { useEventTimer } from "@/lib/useEventTimer";

interface EventTimerDisplayProps {
  label?: string;
  align?: "left" | "right";
  className?: string;
  labelClassName?: string;
  timeClassName?: string;
  showBadge?: boolean;
}

export default function EventTimerDisplay({
  label = "Time left",
  align = "right",
  className = "",
  labelClassName,
  timeClassName,
  showBadge = true,
}: EventTimerDisplayProps) {
  const { status, formatted } = useEventTimer();

  const alignmentClass = align === "left" ? "text-left" : "text-right";
  const badgeJustify = align === "left" ? "justify-start" : "justify-end";

  let statusBadge = null;
  if (showBadge) {
    if (status === "paused") {
      statusBadge = (
        <span className="inline-flex items-center px-1.5 py-0.2 rounded-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-mono tracking-wider font-semibold animate-pulse">
          PAUSED
        </span>
      );
    } else if (status === "idle") {
      statusBadge = (
        <span className="inline-flex items-center px-1.5 py-0.2 rounded-xs bg-cyan/10 text-cyan/70 border border-cyan/30 text-[9px] font-mono tracking-wider">
          STANDBY
        </span>
      );
    } else if (status === "expired") {
      statusBadge = (
        <span className="inline-flex items-center px-1.5 py-0.2 rounded-xs bg-red-500/20 text-red-400 border border-red-500/40 text-[9px] font-mono tracking-wider font-semibold">
          TIME UP
        </span>
      );
    }
  }

  let colorClass = "text-white";
  if (status === "paused") colorClass = "text-amber-300";
  else if (status === "expired") colorClass = "text-red-400";

  return (
    <div className={`font-sans ${alignmentClass} ${className}`}>
      <div className={`flex items-center gap-2 ${badgeJustify}`}>
        <p className={labelClassName || "text-[12px] uppercase tracking-[.1em] text-white/50"}>
          {label}
        </p>
        {statusBadge}
      </div>
      <p className={timeClassName || `text-[20px] font-medium tabular-nums ${colorClass}`}>
        {formatted}
      </p>
    </div>
  );
}
