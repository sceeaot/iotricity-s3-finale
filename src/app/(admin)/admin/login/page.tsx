"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, KeyRound, User, ArrowLeft, ArrowRight, AlertTriangle, Terminal } from "lucide-react";

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

export default function AdminLogin() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Authentication failed. Check credentials.");
        setLoading(false);
        return;
      }
      router.push("/admin/dashboard");
    } catch {
      setError("Network timeout communicating with authorization server.");
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen flex flex-col justify-between p-6 sm:p-10 bg-[#040711] text-paper selection:bg-cyan selection:text-ink">
      {/* Background ambient lighting */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-cyan/10 blur-[130px] rounded-full" />
        <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-blue-600/10 blur-[100px] rounded-full" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#00e5ff 1px, transparent 1px), linear-gradient(90deg, #00e5ff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Top Bar Navigation */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between">
        <a
          href="/"
          className="group inline-flex items-center gap-2 font-mono text-xs text-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          <span>RETURN TO PORTAL</span>
        </a>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm border border-cyan/30 bg-cyan/5 font-mono text-[11px] text-cyan tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-ping" />
          SECURE CHANNEL // 04
        </div>
      </header>

      {/* Center Command Access Box */}
      <section className="w-full max-w-md mx-auto my-auto py-8">
        <div className="relative border border-line/90 bg-[#080d1a]/85 backdrop-blur-md p-7 sm:p-9 shadow-2xl shadow-cyan/5">
          <CornerMarks size={12} />

          {/* Subheader Badge */}
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 border border-cyan/40 bg-cyan/10 text-cyan rounded-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-mono tracking-[0.2em] uppercase text-cyan">
                ORGANIZER CONTROL MATRIX
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Mission Control
              </h1>
            </div>
          </div>

          <p className="text-muted text-xs leading-relaxed mb-6 font-sans">
            Restricted entry. Authenticate with root organizer credentials to manage live tournament telemetry, point overrides, and component dispatches.
          </p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono tracking-[0.14em] uppercase text-muted mb-1.5">
                OPERATOR CALLSIGN
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  autoComplete="username"
                  required
                  placeholder="admin"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-[#0d1424] border border-line text-white placeholder-muted/50 text-sm font-mono outline-none transition-all focus:border-cyan focus:ring-1 focus:ring-cyan/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono tracking-[0.14em] uppercase text-muted mb-1.5">
                SECURITY PASSPHRASE
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-[#0d1424] border border-line text-white placeholder-muted/50 text-sm font-mono outline-none transition-all focus:border-cyan focus:ring-1 focus:ring-cyan/40"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/40 rounded-xs flex items-center gap-2.5 text-xs text-red-400 font-mono animate-rise">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="relative w-full group overflow-hidden border border-cyan bg-cyan/90 hover:bg-cyan text-[#040711] font-mono font-bold text-xs uppercase tracking-widest py-3.5 px-4 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2 shadow-lg shadow-cyan/20"
            >
              <span>{loading ? "VERIFYING SECURITY TOKENS..." : "ENTER CONTROL ROOM"}</span>
              {!loading && (
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-line/60 flex items-center justify-between text-[10px] font-mono text-muted/60">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3 h-3 text-cyan/70" />
              AUTH GATE v3.2
            </span>
            <span>TLS-ENCRYPTED 256-BIT</span>
          </div>
        </div>
      </section>

      {/* Footer warning */}
      <footer className="w-full max-w-5xl mx-auto text-center font-mono text-[10px] text-muted/50 tracking-wider">
        IOTRICITY SEASON 03 • ELECTRICAL ENGINEERING STUDENTS CHAPTER • ACADEMY OF TECHNOLOGY
      </footer>
    </main>
  );
}