"use client";

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Hint = { index: number; cost: number; revealed: boolean; text: string | null };
type StageData = { completed?: boolean; coins?: number; teamCoins?: number; currentStage?: number; completedStages?: number[]; stageNumber?: number; title?: string; message?: string; puzzle?: string; coinsReward?: number; hints?: Hint[] };

export default function Dashboard() {
  const [data, setData] = useState<StageData | null>(null);
  const [answer, setAnswer] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const load = useCallback(async () => {
    const response = await fetch('/api/stage/current');
    if (response.status === 401) {
      router.push('/login');
      return;
    }
    setMessage('');
    setData(await response.json());
  }, [router]);
  useEffect(() => { load(); }, [load]);
  async function submit(event: FormEvent) { event.preventDefault(); setBusy(true); setMessage(''); const response = await fetch('/api/stage/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answer }) }); const result = await response.json(); setBusy(false); setMessage(result.correct ? `Correct. +${result.coinsEarned} BC added.` : result.message || result.error); if (result.correct) { setAnswer(''); setTimeout(load, 500); } }
  async function unlockHint(index: number, cost: number) { if (!window.confirm(`Unlock this hint for ${cost} BC?`)) return; const response = await fetch('/api/stage/hint', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hintIndex: index }) }); const result = await response.json(); if (!response.ok) setMessage(result.error); else load(); }
  if (!data) return <main className="page shell"><p className="muted">SYNCING FIELD NODE...</p></main>;
  const completedStages = data.completedStages || [];
  const stageNumber = data.stageNumber ?? 1;
  const isLocationHunt = stageNumber === 2 || stageNumber === 3;
  const isVolunteerStage = stageNumber === 4 || stageNumber === 5;
  const showPuzzle = !isLocationHunt && !isVolunteerStage;
  return <>
    <header className="topbar"><div className="shell topbar-inner"><a className="brand" href="/">IOTRICITY <span>// S03</span></a><nav className="nav"><a href="/shop">Shop</a><a href="/leaderboard">Rankings</a><button onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); }}>Disconnect</button></nav></div></header>
    <main className="page shell fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'end', marginBottom: 34 }}><div><p className="eyebrow">TEAM FIELD CONSOLE</p><h1 style={{ fontSize: 36, margin: '12px 0 0' }}>Active challenge</h1></div><div className="stat" style={{ minWidth: 140 }}><span className="muted">BREACH CREDITS</span><strong>{data.teamCoins ?? data.coins ?? 0}</strong></div></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 22 }}>{[1, 2, 3, 4, 5].map((stage) => <div key={stage} style={{ padding: '12px 8px', border: '1px solid var(--line)', background: completedStages.includes(stage) ? 'var(--acid)' : stage === data.currentStage ? '#27332b' : 'transparent', color: completedStages.includes(stage) ? 'var(--ink)' : 'var(--paper)', textAlign: 'center', fontSize: 12 }}>S0{stage} {completedStages.includes(stage) ? 'OK' : ''}</div>)}</div>
      {data.completed ? <div className="panel"><p className="eyebrow">MISSION COMPLETE</p><h2 style={{ fontSize: 30, margin: '16px 0' }}>All stages cleared.</h2><p className="muted">Your credits remain live. Continue to the component shop to redeem your build.</p><a className="button" href="/shop" style={{ marginTop: 24 }}>OPEN COMPONENT SHOP</a></div> : <div className="split">
        <section><div className="panel"><p className="eyebrow">STAGE {data.stageNumber} / REWARD {data.coinsReward} BC</p><h2 style={{ fontSize: 28, margin: '16px 0 10px' }}>{data.title}</h2><p className="muted" style={{ lineHeight: 1.7 }}>{data.message}</p></div>
          <div className="panel" style={{ marginTop: 12, borderColor: 'var(--acid)', background: '#18221b' }}>
            <p className="eyebrow">PUZZLE / QUESTION</p>
            {showPuzzle ? <p style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: '14px 0 0' }}>{data.puzzle}</p> : (
              <p style={{ lineHeight: 1.8, margin: '14px 0 0', color: 'var(--paper)' }}>
                {isLocationHunt
                  ? 'Scan the QR code you find at that location. The puzzle statement will be revealed there.'
                  : 'Find the volunteer and ask them for the problem statement. Then submit your answer below.'}
              </p>
            )}
          </div>
          <form onSubmit={submit} style={{ marginTop: 16 }}><input className="input" value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Transmit answer..." required />{message && <p style={{ color: message.startsWith('Correct') ? 'var(--acid)' : 'var(--orange)', margin: '12px 0', lineHeight: 1.6 }}>{message}</p>}<button className="button" style={{ marginTop: 4, width: '100%' }} disabled={busy}>{busy ? 'CHECKING SIGNAL...' : 'SUBMIT ANSWER'}</button></form>
        </section>
        <aside><p className="eyebrow" style={{ marginBottom: 12 }}>OPTIONAL INTEL</p>{(data.hints || []).map((hint) => <div className="panel" key={hint.index} style={{ marginBottom: 8, padding: 16 }}>{hint.revealed ? <p style={{ lineHeight: 1.5, color: 'var(--cyan)' }}>{hint.text}</p> : <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}><span className="muted">HINT 0{hint.index + 1}</span><button className="button secondary" onClick={() => unlockHint(hint.index, hint.cost)} style={{ padding: '8px 10px', fontSize: 11 }}>UNLOCK {hint.cost}</button></div>}</div>)}</aside>
      </div>}
    </main>
  </>;
}