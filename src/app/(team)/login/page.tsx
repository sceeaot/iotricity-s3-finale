"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import EventTimerDisplay from "@/components/EventTimerDisplay";

export default function Login() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/team-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamCode: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid team code");
        setBusy(false);
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Network error. Please try again.");
      setBusy(false);
    }
  }

  return (
    <main className="relative isolate min-h-screen min-h-[100svh] overflow-hidden bg-[#030713] text-white">
      <Image
        src="/background_landing.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-center"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[#020611]/25" />

      <header className="absolute inset-x-0 top-0 flex items-start justify-between px-6 pt-6 sm:px-8 sm:pt-7">
        <a href="/" className="transition hover:opacity-80">
          <Image src="/scee_logo.png" alt="SCEE" width={64} height={25} className="h-auto w-24" />
        </a>
        <EventTimerDisplay label="Time left" align="right" />
      </header>

      <section className="absolute inset-0 flex items-center justify-center px-6 pb-16 sm:pb-10 pointer-events-none">
        <Image
          src="/Iotricity-logo-hero.png"
          alt="IoTRICITY 3: Build, solve, breach, survive"
          width={754}
          height={240}
          priority
          sizes="(max-width: 640px) 88vw, (max-width: 900px) 70vw, 754px"
          className="h-auto w-[min(754px,88vw)] animate-rise"
        />
      </section>

      <form
        onSubmit={submit}
        className="absolute bottom-6 right-6 flex w-[calc(100%-3rem)] flex-col items-end gap-2 sm:bottom-8 sm:right-8 sm:w-auto"
      >
        {error && (
          <p className="text-[13px] font-medium tracking-wide text-[#ff4d4d] self-start sm:self-auto animate-rise">
            {error}
          </p>
        )}
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <div className="relative flex flex-1 items-center border border-white/25 bg-black/15 sm:w-[380px]">
            <input
              type="text"
              id="team-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter your Team Code"
              className="h-[60px] w-full bg-transparent px-6 font-sans text-[17px] font-normal text-white placeholder:text-white/60 focus:outline-none"
              required
              autoFocus
              autoComplete="off"
              spellCheck="false"
            />
            <span aria-hidden="true" className="pointer-events-none absolute -left-[1px] -top-[1px] h-[9px] w-[9px] border-l-2 border-t-2 border-white/90" />
            <span aria-hidden="true" className="pointer-events-none absolute -right-[1px] -top-[1px] h-[9px] w-[9px] border-r-2 border-t-2 border-white/90" />
            <span aria-hidden="true" className="pointer-events-none absolute -bottom-[1px] -left-[1px] h-[9px] w-[9px] border-b-2 border-l-2 border-white/90" />
            <span aria-hidden="true" className="pointer-events-none absolute -bottom-[1px] -right-[1px] h-[9px] w-[9px] border-b-2 border-r-2 border-white/90" />
          </div>
          <button
            type="submit"
            disabled={busy}
            aria-label="Submit team code"
            className="flex h-[60px] w-[60px] shrink-0 items-center justify-center bg-white text-[#080d19] transition hover:bg-white/85 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#080d19] border-t-transparent" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </main>
  );
}