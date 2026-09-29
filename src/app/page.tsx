import Image from "next/image";

export default function Home() {
  return (
    <main className="landing-page relative isolate min-h-screen min-h-[100svh] overflow-hidden bg-[#030713] text-white font-['Wix_Madefor_Display',sans-serif]">
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
        <Image src="/scee_logo.png" alt="SCEE" width={64} height={25} className="h-auto w-24" />
        <div className="text-right font-sans">
          <p className="text-[12px] uppercase tracking-[.1em] text-white/50">Time left</p>
          <p className="text-[20px] font-medium tabular-nums">03H 55M 22S</p>
        </div>
      </header>

      <section className="absolute inset-0 flex items-center justify-center px-6 pb-16 sm:pb-10">
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

      <div className="absolute bottom-4 left-6 z-20 sm:bottom-8 sm:left-8">
        <a
          href="/admin"
          className="group inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.16em] uppercase text-white/40 transition-colors duration-200 hover:text-cyan"
        >
          <span>Admin</span>
          <svg
            className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-white/40 group-hover:text-cyan"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
          </svg>
        </a>
      </div>

      <nav aria-label="Main navigation" className="absolute bottom-12 right-6 flex w-[calc(100%-3rem)] flex-col gap-3 sm:bottom-8 sm:right-8 sm:w-auto sm:flex-row">
        <a
          className="flex min-h-[68px] items-center justify-center border border-white bg-white px-10 text-[17px] font-semibold text-[#080d19] no-underline transition hover:bg-white/85"
          href="/login"
        >
          ENTER AS TEAM
        </a>
        <a
          className="relative flex min-h-[68px] items-center justify-center border border-white/25 bg-black/15 px-10 font-sans text-[17px] font-medium text-white no-underline transition hover:bg-white/10"
          href="/leaderboard"
        >
          VIEW LEADERBOARD
          <span aria-hidden="true" className="absolute left-0 top-0 h-[9px] w-[9px] border-l-2 border-t-2 border-white/80" />
          <span aria-hidden="true" className="absolute right-0 top-0 h-[9px] w-[9px] border-r-2 border-t-2 border-white/80" />
          <span aria-hidden="true" className="absolute bottom-0 left-0 h-[9px] w-[9px] border-b-2 border-l-2 border-white/80" />
          <span aria-hidden="true" className="absolute bottom-0 right-0 h-[9px] w-[9px] border-b-2 border-r-2 border-white/80" />
        </a>
      </nav>
    </main>
  );
}
