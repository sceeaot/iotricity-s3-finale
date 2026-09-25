"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Hint = {
  index: number;
  cost: number;
  revealed: boolean;
  text: string | null;
};
type StageData = {
  completed?: boolean;
  coins?: number;
  teamCoins?: number;
  currentStage?: number;
  completedStages?: number[];
  stageNumber?: number;
  title?: string;
  message?: string;
  puzzle?: string;
  coinsReward?: number;
  hints?: Hint[];
};

export default function Dashboard() {
  const [data, setData] = useState<StageData | null>(null);
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const load = useCallback(async () => {
    const response = await fetch("/api/stage/current");
    if (response.status === 401) {
      router.push("/login");
      return;
    }
    setMessage("");
    setData(await response.json());
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/stage/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer }),
    });
    const result = await response.json();
    setBusy(false);
    setMessage(
      result.correct
        ? `Correct. +${result.coinsEarned} BC added.`
        : result.message || result.error,
    );
    if (result.correct) {
      setAnswer("");
      setTimeout(load, 500);
    }
  }

  async function unlockHint(index: number, cost: number) {
    if (!window.confirm(`Unlock this hint for ${cost} BC?`)) return;
    const response = await fetch("/api/stage/hint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hintIndex: index }),
    });
    const result = await response.json();
    if (!response.ok) setMessage(result.error);
    else load();
  }

  if (!data)
    return (
      <main className="py-[42px] pb-[70px] max-[760px]:pt-[28px] w-[min(1180px,calc(100%-40px))] max-[760px]:w-[min(calc(100%-28px),620px)] mx-auto">
        <p className="text-muted">SYNCING FIELD NODE...</p>
      </main>
    );

  const completedStages = data.completedStages || [];
  const stageNumber = data.stageNumber ?? 1;
  const isLocationHunt = stageNumber === 2 || stageNumber === 3;
  const isVolunteerStage = stageNumber === 4 || stageNumber === 5;
  const showPuzzle = !isLocationHunt && !isVolunteerStage;

  return (
    <>
      <header className="border-b border-line py-[22px] max-[760px]:py-4 w-full">
        <div className="w-[min(1180px,calc(100%-40px))] max-[760px]:w-[min(calc(100%-28px),620px)] mx-auto flex flex-row items-center justify-between gap-3">
          <a className="font-bold tracking-[.08em] no-underline shrink-0 text-sm sm:text-base" href="/">
            IOTRICITY <span className="text-acid">// S03</span>
          </a>
          <nav className="flex flex-row items-center gap-2.5 sm:gap-3 shrink-0">
            <a
              href="/shop"
              aria-label="Open shop"
              title="Shop"
              className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg border border-line bg-white/5 text-paper transition hover:bg-white/10 hover:border-white/20 active:scale-95 shrink-0"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 4h2l1.6 8.5a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.76L19 7H7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="10" cy="17.5" r="1.4" fill="currentColor" />
                <circle cx="17" cy="17.5" r="1.4" fill="currentColor" />
              </svg>
            </a>
            <button
              aria-label="Disconnect"
              title="Disconnect"
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                router.push("/login");
              }}
              className="inline-flex h-9 w-9 sm:h-10 sm:w-10 cursor-pointer items-center justify-center rounded-lg border border-line bg-white/5 text-paper transition hover:bg-white/10 hover:border-white/20 active:scale-95 shrink-0"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M10 17v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15 7l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M20 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </nav>
        </div>
      </header>
      <main className="py-[42px] pb-[70px] max-[760px]:pt-[28px] w-[min(1180px,calc(100%-40px))] max-[760px]:w-[min(calc(100%-28px),620px)] mx-auto animate-rise">
        <div className="flex justify-between gap-5 items-end mb-[34px]">
          <div>
            <p className="text-acid text-[11px] tracking-[.16em] uppercase">TEAM FIELD CONSOLE</p>
            <h1 className="text-[36px] mt-[12px] mb-0 font-bold">Active challenge</h1>
          </div>
          <div className="border-t-2 border-acid pt-[12px] min-w-[140px]">
            <span className="text-muted text-xs block">BREACH CREDITS</span>
            <div className="w-full flex items-baseline justify-between gap-2">
              <strong className="block text-[30px] mt-[7px] font-bold">{data.teamCoins ?? data.coins ?? 0}</strong>
              <a href="/shop" className="text-acid text-xs hover:underline font-bold">SHOP</a>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-2 mb-[22px]">
          {[1, 2, 3, 4, 5].map((stage) => (
            <div
              key={stage}
              className={`p-[12px_8px] border border-line text-center text-xs font-mono transition ${
                completedStages.includes(stage)
                  ? "bg-acid text-ink font-bold"
                  : stage === data.currentStage
                  ? "bg-[#27332b] text-paper border-acid"
                  : "bg-transparent text-paper"
              }`}
            >
              S0{stage} {completedStages.includes(stage) ? "OK" : ""}
            </div>
          ))}
        </div>
        {data.completed ? (
          <div className="border border-line bg-[#101313]/78 p-6 print:border-[#aaa]">
            <p className="text-acid text-[11px] tracking-[.16em] uppercase">MISSION COMPLETE</p>
            <h2 className="text-[30px] my-4 font-bold">All stages cleared.</h2>
            <p className="text-muted">
              Your credits remain live. Continue to the component shop to redeem your build.
            </p>
            <a className="border border-acid bg-acid text-ink px-4 py-3 font-bold no-underline inline-block hover:bg-[#efffa8] transition mt-6" href="/shop">
              OPEN COMPONENT SHOP
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-[1.4fr_0.8fr] max-[760px]:grid-cols-1 gap-5">
            <section>
              <div className="border border-line bg-[#101313]/78 p-6 print:border-[#aaa]">
                <p className="text-acid text-[11px] tracking-[.16em] uppercase">
                  STAGE {data.stageNumber} / REWARD {data.coinsReward} BC
                </p>
                <h2 className="text-[28px] mt-[16px] mb-[10px] font-bold">{data.title}</h2>
                <p className="text-muted leading-[1.7]">{data.message}</p>
              </div>
              <div className="border border-acid bg-[#18221b] p-6 mt-3">
                <p className="text-acid text-[11px] tracking-[.16em] uppercase">PUZZLE / QUESTION</p>
                {showPuzzle ? (
                  <p className="leading-[1.8] whitespace-pre-wrap mt-[14px]">{data.puzzle}</p>
                ) : (
                  <p className="leading-[1.8] mt-[14px] text-paper">
                    {isLocationHunt
                      ? "Scan the QR code you find at that location. The puzzle statement will be revealed there."
                      : "Find the volunteer and ask them for the problem statement. Then submit your answer below."}
                  </p>
                )}
              </div>
              <form onSubmit={submit} className="mt-4">
                <input
                  className="w-full border border-line bg-[#151c19] text-paper p-3.5 outline-none focus:border-acid"
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  placeholder="Type your answer..."
                  required
                />
                {message && (
                  <p className={`my-3 leading-[1.6] ${message.startsWith("Correct") ? "text-acid" : "text-orange"}`}>
                    {message}
                  </p>
                )}
                <button
                  className="border border-acid bg-acid text-ink px-4 py-3 font-bold no-underline inline-block hover:bg-[#efffa8] disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer mt-1 w-full transition"
                  disabled={busy}
                >
                  {busy ? "CHECKING SIGNAL..." : "SUBMIT ANSWER"}
                </button>
              </form>
            </section>
            <aside>
              <p className="text-acid text-[11px] tracking-[.16em] uppercase mb-3">OPTIONAL INTEL</p>
              {(data.hints || []).map((hint) => (
                <div className="border border-line bg-[#101313]/78 p-4 mb-2 print:border-[#aaa]" key={hint.index}>
                  {hint.revealed ? (
                    <p className="leading-[1.5] text-cyan">{hint.text}</p>
                  ) : (
                    <div className="flex justify-between gap-2.5 items-center">
                      <span className="text-muted text-xs">HINT 0{hint.index + 1}</span>
                      <button
                        className="border border-line bg-transparent text-paper hover:bg-white/10 px-2.5 py-2 text-[11px] font-bold transition"
                        onClick={() => unlockHint(hint.index, hint.cost)}
                      >
                        UNLOCK {hint.cost}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </aside>
          </div>
        )}
      </main>
    </>
  );
}
