import Image from "next/image";

export default function Home() {
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

      <nav aria-label="Main navigation" className="absolute bottom-6 right-6 flex w-[calc(100%-3rem)] flex-col gap-3 sm:bottom-8 sm:right-8 sm:w-auto sm:flex-row">
        <a
          className="flex min-h-11 items-center justify-center border border-white bg-white px-5 text-[10px] font-semibold text-[#080d19] no-underline transition hover:bg-white/85 sm:min-w-[110px]"
          href="/login"
        >
          ENTER AS TEAM
        </a>
        <a
          className="relative flex min-h-[68px] items-center justify-center border border-white/25 bg-black/15 px-6 font-sans text-[17px] font-medium text-white no-underline transition hover:bg-white/10 sm:min-w-[294px]"
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
