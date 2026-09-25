"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/team-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamCode: code }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main className="py-[42px] pb-[70px] max-[760px]:pt-[28px] w-[min(1180px,calc(100%-40px))] max-[760px]:w-[min(calc(100%-28px),620px)] mx-auto max-w-[520px] animate-rise">
      <a className="font-bold tracking-[.08em] no-underline" href="/">
        IOTRICITY <span className="text-acid">// S03</span>
      </a>
      <div className="mt-[80px]">
        <p className="text-acid text-[11px] tracking-[.16em] uppercase">FIELD ACCESS / TEAM NODE</p>
        <h1 className="text-[46px] mt-[18px] mb-[12px] font-bold leading-tight">
          Identify your<br />
          <span className="text-acid">crew.</span>
        </h1>
        <p className="text-muted leading-[1.6]">Enter the code issued to your team to open the current challenge.</p>
        <form onSubmit={submit} className="border border-line bg-[#101313]/78 p-6 mt-[30px]">
          <label className="text-acid text-[11px] tracking-[.16em] uppercase block" htmlFor="team-code">
            TEAM CODE
          </label>
          <input
            id="team-code"
            className="w-full border border-line bg-[#151c19] text-paper p-3.5 outline-none focus:border-acid mt-[12px] mb-[16px] uppercase"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="TEAM01"
            required
            autoFocus
          />
          {error && <p className="text-orange mb-[14px]">{error}</p>}
          <button
            className="border border-acid bg-acid text-ink px-4 py-3 font-bold no-underline inline-block hover:bg-[#efffa8] disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer w-full transition"
            disabled={busy}
          >
            {busy ? "CONNECTING..." : "OPEN FIELD NODE"}
          </button>
        </form>
        <a href="/admin/login" className="text-muted block mt-6 text-xs hover:text-paper transition">
          Organizer access -&gt;
        </a>
      </div>
    </main>
  );
}