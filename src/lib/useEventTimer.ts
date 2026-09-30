"use client";

import { useEffect, useState, useRef, useCallback } from "react";

export type TimerStatus = "idle" | "running" | "paused" | "expired";

export interface TimerData {
  status: TimerStatus;
  remainingSeconds: number;
  durationSeconds: number;
  endsAt: string | null;
  startedAt: string | null;
  serverTime: string;
  formatted: string;
}

export function formatTimeRemaining(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}H ${pad(m)}M ${pad(s)}S`;
}

export function useEventTimer() {
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [remainingSeconds, setRemainingSeconds] = useState<number>(3 * 3600);
  const [durationSeconds, setDurationSeconds] = useState<number>(3 * 3600);
  const [endsAt, setEndsAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Offset between server time and local client time (ms)
  const offsetRef = useRef<number>(0);
  const dataRef = useRef<{ status: TimerStatus; endsAt: string | null; remainingSeconds: number }>({
    status: "idle",
    endsAt: null,
    remainingSeconds: 3 * 3600,
  });

  const sync = useCallback(async () => {
    try {
      const clientReqTime = Date.now();
      const res = await fetch("/api/timer", { cache: "no-store" });
      if (!res.ok) return;
      const data: TimerData = await res.json();

      const clientRecvTime = Date.now();
      const clientEstimatedServerTime = clientReqTime + (clientRecvTime - clientReqTime) / 2;
      const serverTimeMs = new Date(data.serverTime).getTime();
      offsetRef.current = serverTimeMs - clientEstimatedServerTime;

      dataRef.current = {
        status: data.status,
        endsAt: data.endsAt,
        remainingSeconds: data.remainingSeconds,
      };

      setStatus(data.status);
      setDurationSeconds(data.durationSeconds || 3 * 3600);
      setEndsAt(data.endsAt);

      if (data.status === "running" && data.endsAt) {
        const adjustedNow = Date.now() + offsetRef.current;
        const diff = Math.max(0, Math.ceil((new Date(data.endsAt).getTime() - adjustedNow) / 1000));
        setRemainingSeconds(diff);
        if (diff <= 0) setStatus("expired");
      } else {
        setRemainingSeconds(data.remainingSeconds);
      }
    } catch (e) {
      console.error("Timer sync error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll server every 4 seconds to sync status/pause changes
  useEffect(() => {
    sync();
    const pollId = setInterval(sync, 4000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") sync();
    };
    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", sync);

    return () => {
      clearInterval(pollId);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", sync);
    };
  }, [sync]);

  // Local 1-second tick for butter-smooth countdown
  useEffect(() => {
    const tick = () => {
      const { status: currentStatus, endsAt: currentEndsAt, remainingSeconds: currentRemaining } = dataRef.current;

      if (currentStatus === "running" && currentEndsAt) {
        const adjustedNow = Date.now() + offsetRef.current;
        const diff = Math.max(0, Math.ceil((new Date(currentEndsAt).getTime() - adjustedNow) / 1000));
        setRemainingSeconds(diff);
        if (diff <= 0) {
          setStatus("expired");
          dataRef.current.status = "expired";
        }
      } else if (currentStatus === "paused" || currentStatus === "idle") {
        setRemainingSeconds(currentRemaining);
      }
    };

    const tickId = setInterval(tick, 1000);
    return () => clearInterval(tickId);
  }, []);

  return {
    status,
    remainingSeconds,
    durationSeconds,
    endsAt,
    formatted: formatTimeRemaining(remainingSeconds),
    loading,
    sync,
  };
}
