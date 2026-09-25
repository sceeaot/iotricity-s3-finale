export default function Home() {
  return <main className="page shell fade-in">
    <p className="eyebrow">EE STUDENTS CHAPTER / ACADEMY OF TECHNOLOGY</p>
    <h1 style={{ fontSize: "clamp(46px, 9vw, 108px)", lineHeight: .9, maxWidth: 800, margin: "30px 0 24px" }}>IoTRICITY<br /><span style={{ color: "var(--acid)" }}>SEASON 03</span></h1>
    <div className="split" style={{ alignItems: "end", marginTop: 50 }}>
      <div>
        <p style={{ fontSize: 20, lineHeight: 1.5, maxWidth: 560 }}>A live field system for teams solving signals, collecting credits, and redeeming the hardware they earn.</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 30 }}><a className="button" href="/login">ENTER AS TEAM</a><a className="button secondary" href="/leaderboard">VIEW RANKINGS</a></div>
      </div>
      <div className="panel"><p className="eyebrow">SYSTEM STATUS</p><p style={{ fontSize: 22, margin: "18px 0 8px" }}>EVENT NODE ONLINE</p><p className="muted">Five stages / four components / one final build.</p><a href="/admin/login" className="muted" style={{ display: "block", marginTop: 25, fontSize: 12 }}>Organizer access -&gt;</a></div>
    </div>
  </main>;
}
