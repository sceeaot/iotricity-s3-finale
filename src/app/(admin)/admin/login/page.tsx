"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/auth/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    router.push("/admin/dashboard");
  }

  return (
    <main className="py-[42px] pb-[70px] max-[760px]:pt-[28px] w-[min(1180px,calc(100%-40px))] max-[760px]:w-[min(calc(100%-28px),620px)] mx-auto max-w-[520px]">
      <a className="font-bold tracking-[.08em] no-underline" href="/">
        IOTRICITY <span className="text-acid">// CONTROL</span>
      </a>
      <div className="mt-[90px]">
        <p className="text-acid text-[11px] tracking-[.16em] uppercase">ORGANIZER ACCESS</p>
        <h1 className="text-[44px] mt-[18px] mb-[12px] font-bold leading-tight">
          Control<br />
          <span className="text-orange">room.</span>
        </h1>
        <form onSubmit={submit} className="border border-line bg-[#101313]/78 p-6 mt-[30px]">
          <label className="text-acid text-[11px] tracking-[.16em] uppercase block">USERNAME</label>
          <input
            className="w-full border border-line bg-[#151c19] text-paper p-3.5 outline-none focus:border-acid mt-[10px] mb-[16px]"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
          <label className="text-acid text-[11px] tracking-[.16em] uppercase block">PASSWORD</label>
          <input
            type="password"
            className="w-full border border-line bg-[#151c19] text-paper p-3.5 outline-none focus:border-acid mt-[10px] mb-[16px]"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          {error && <p className="text-orange mb-[14px]">{error}</p>}
          <button className="border border-acid bg-acid text-ink px-4 py-3 font-bold no-underline inline-block hover:bg-[#efffa8] cursor-pointer w-full transition">
            ENTER CONTROL ROOM
          </button>
        </form>
      </div>
    </main>
  );
}