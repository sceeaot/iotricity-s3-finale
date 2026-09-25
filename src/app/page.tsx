export default function Home() {
  return (
    <main className="py-[42px] pb-[70px] max-[760px]:pt-[28px] w-[min(1180px,calc(100%-40px))] max-[760px]:w-[min(calc(100%-28px),620px)] mx-auto animate-rise">
      <p className="text-acid text-[11px] tracking-[.16em] uppercase">EE STUDENTS CHAPTER / ACADEMY OF TECHNOLOGY</p>
      <h1 className="text-[clamp(46px,9vw,108px)] leading-[0.9] max-w-[800px] mt-[30px] mb-6 font-bold">
        IoTRICITY<br />
        <span className="text-acid">SEASON 03</span>
      </h1>
      <div className="grid grid-cols-[1.4fr_0.8fr] max-[760px]:grid-cols-1 gap-5 items-end mt-[50px]">
        <div>
          <p className="text-xl leading-[1.5] max-w-[560px]">
            A live field system for teams solving signals, collecting credits, and redeeming the hardware they earn.
          </p>
          <div className="flex gap-3 flex-wrap mt-[30px]">
            <a className="border border-acid bg-acid text-ink px-4 py-3 font-bold no-underline inline-block hover:bg-[#efffa8] transition" href="/login">
              ENTER AS TEAM
            </a>
            <a className="border border-line bg-transparent text-paper px-4 py-3 font-bold no-underline inline-block hover:bg-white/10 transition" href="/leaderboard">
              VIEW RANKINGS
            </a>
          </div>
        </div>
        <div className="border border-line bg-[#101313]/78 p-6 print:border-[#aaa]">
          <p className="text-acid text-[11px] tracking-[.16em] uppercase">SYSTEM STATUS</p>
          <p className="text-[22px] mt-[18px] mb-[8px]">EVENT NODE ONLINE</p>
          <p className="text-muted">Five stages / four components / one final build.</p>
          <a href="/admin/login" className="text-muted block mt-[25px] text-xs hover:text-paper transition">
            Organizer access -&gt;
          </a>
        </div>
      </div>
    </main>
  );
}
