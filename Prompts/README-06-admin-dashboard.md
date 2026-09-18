# TASK 06 - Admin Dashboard

## What you are doing
Admin sees a live leaderboard of all 12 teams ranked by coins and stage
progress. Clicking a team opens their detailed panel. Admin can manually
override credits and view all transactions.

---

## API: app/api/admin/leaderboard/route.js

```js
import connectDB from '@/lib/mongodb';
import Team from '@/models/Team';
import Purchase from '@/models/Purchase';
import { requireAdmin } from '@/lib/requireAuth';

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  await connectDB();

  const teams = await Team.find({}).sort({ coins: -1, currentStage: -1 });

  const leaderboard = await Promise.all(
    teams.map(async (team, index) => {
      const purchases = await Purchase.find({ teamId: team._id });
      return {
        rank: index + 1,
        _id: team._id,
        teamName: team.teamName,
        coins: team.coins,
        currentStage: team.currentStage,
        completedStages: team.completedStages.length,
        componentsRedeemed: purchases.length,
        status: team.status,
        startTime: team.startTime,
      };
    })
  );

  return Response.json({ leaderboard });
}
```

---

## API: app/api/admin/team/[id]/route.js

```js
import connectDB from '@/lib/mongodb';
import Team from '@/models/Team';
import TeamStageState from '@/models/TeamStageState';
import Purchase from '@/models/Purchase';
import Transaction from '@/models/Transaction';
import { requireAdmin } from '@/lib/requireAuth';

export async function GET(req, { params }) {
  const auth = await requireAdmin();
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  await connectDB();

  const team = await Team.findById(params.id);
  if (!team) return Response.json({ error: 'Team not found' }, { status: 404 });

  const stageStates = await TeamStageState.find({ teamId: team._id }).sort({ stageNumber: 1 });
  const purchases = await Purchase.find({ teamId: team._id });
  const transactions = await Transaction.find({ teamId: team._id }).sort({ timestamp: -1 });

  return Response.json({ team, stageStates, purchases, transactions });
}
```

---

## API: app/api/admin/override/route.js

```js
import connectDB from '@/lib/mongodb';
import Team from '@/models/Team';
import Transaction from '@/models/Transaction';
import { requireAdmin } from '@/lib/requireAuth';

export async function POST(req) {
  const auth = await requireAdmin();
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  const { teamId, amount, reason } = await req.json();

  await connectDB();

  await Team.updateOne({ _id: teamId }, { $inc: { coins: amount } });

  await Transaction.create({
    teamId,
    type: 'override',
    amount,
    reason: reason || `Manual override by admin`,
  });

  return Response.json({ success: true });
}
```

---

## Page: app/(admin)/admin/dashboard/page.js

```js
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamDetail, setTeamDetail] = useState(null);
  const [overrideForm, setOverrideForm] = useState({ amount: '', reason: '' });
  const router = useRouter();

  async function fetchLeaderboard() {
    const res = await fetch('/api/admin/leaderboard');
    if (res.status === 401) { router.push('/admin/login'); return; }
    const json = await res.json();
    setLeaderboard(json.leaderboard || []);
  }

  async function fetchTeamDetail(id) {
    const res = await fetch(`/api/admin/team/${id}`);
    const json = await res.json();
    setTeamDetail(json);
  }

  useEffect(() => {
    fetchLeaderboard();
    // Poll every 5 seconds
    const interval = setInterval(fetchLeaderboard, 5000);
    return () => clearInterval(interval);
  }, []);

  function handleSelectTeam(team) {
    setSelectedTeam(team);
    setTeamDetail(null);
    fetchTeamDetail(team._id);
  }

  async function handleOverride(e) {
    e.preventDefault();
    const amount = parseInt(overrideForm.amount);
    if (isNaN(amount)) return;

    await fetch('/api/admin/override', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamId: selectedTeam._id,
        amount,
        reason: overrideForm.reason,
      }),
    });

    setOverrideForm({ amount: '', reason: '' });
    fetchLeaderboard();
    fetchTeamDetail(selectedTeam._id);
  }

  const stageLabels = ['S1', 'S2', 'S3', 'S4', 'S5'];

  return (
    <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', minHeight: '100vh' }}>

      {/* LEFT - Leaderboard */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px' }}>Live Leaderboard</h2>
          <span style={{ fontSize: '11px', color: '#555' }}>auto-refresh 5s</span>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Team</th>
              <th>Stage</th>
              <th>Coins</th>
              <th>Parts</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((team) => (
              <tr
                key={team._id}
                onClick={() => handleSelectTeam(team)}
                style={{
                  cursor: 'pointer',
                  backgroundColor: selectedTeam?._id === team._id ? '#1a1a1a' : 'transparent',
                }}
              >
                <td style={{ color: '#555' }}>{team.rank}</td>
                <td>{team.teamName}</td>
                <td>{team.completedStages}/5</td>
                <td style={{ color: '#aaa' }}>{team.coins} BC</td>
                <td>{team.componentsRedeemed}/4</td>
                <td style={{
                  fontSize: '11px',
                  color: team.status === 'completed' ? '#44ff88' : team.status === 'active' ? '#ffaa00' : '#555'
                }}>
                  {team.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: '24px', display: 'flex', gap: '16px' }}>
          <a href="/admin/dispatch">Dispatch Queue</a>
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              router.push('/admin/login');
            }}
            style={{ backgroundColor: '#000', color: '#555', border: '1px solid #333', fontSize: '12px' }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* RIGHT - Team Detail */}
      <div>
        {!selectedTeam ? (
          <div style={{ color: '#333', padding: '40px 0' }}>
            Select a team from the leaderboard to view details.
          </div>
        ) : (
          <div>
            <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>
              {selectedTeam.teamName}
            </h2>

            {/* Stage states */}
            <p style={{ color: '#555', fontSize: '11px', marginBottom: '8px' }}>STAGES</p>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
              {stageLabels.map((label, i) => {
                const stageNum = i + 1;
                const done = teamDetail?.team?.completedStages?.includes(stageNum);
                const active = teamDetail?.team?.currentStage === stageNum;
                return (
                  <div key={i} style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    border: '1px solid #333',
                    backgroundColor: done ? '#fff' : active ? '#222' : '#000',
                    color: done ? '#000' : '#fff',
                  }}>
                    {done ? `✓ ${label}` : label}
                  </div>
                );
              })}
            </div>

            {/* Stats */}
            {teamDetail && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  {[
                    ['Coins', `${teamDetail.team.coins} BC`],
                    ['Status', teamDetail.team.status],
                    ['Components', `${teamDetail.purchases.length}/4`],
                    ['Hints Used', teamDetail.stageStates.reduce((a, s) => a + s.hintsRevealed.length, 0)],
                  ].map(([label, value]) => (
                    <div key={label} style={{ border: '1px solid #222', padding: '12px' }}>
                      <p style={{ color: '#555', fontSize: '11px', marginBottom: '4px' }}>{label}</p>
                      <p style={{ fontSize: '16px' }}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Purchases */}
                <p style={{ color: '#555', fontSize: '11px', marginBottom: '8px' }}>COMPONENTS REDEEMED</p>
                {teamDetail.purchases.length === 0 ? (
                  <p style={{ color: '#333', fontSize: '13px', marginBottom: '20px' }}>None yet</p>
                ) : (
                  <div style={{ marginBottom: '20px' }}>
                    {teamDetail.purchases.map((p) => (
                      <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #111', fontSize: '13px' }}>
                        <span>{p.cyberpunkName}</span>
                        <span style={{ color: p.dispatched ? '#44ff88' : '#ffaa00', fontSize: '11px' }}>
                          {p.dispatched ? 'dispatched' : 'pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Transaction log */}
                <p style={{ color: '#555', fontSize: '11px', marginBottom: '8px' }}>TRANSACTIONS</p>
                <div style={{ maxHeight: '160px', overflowY: 'auto', marginBottom: '20px' }}>
                  {teamDetail.transactions.map((t) => (
                    <div key={t._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #111', fontSize: '12px' }}>
                      <span style={{ color: '#888' }}>{t.reason}</span>
                      <span style={{ color: t.amount > 0 ? '#44ff88' : '#ff4444' }}>
                        {t.amount > 0 ? '+' : ''}{t.amount} BC
                      </span>
                    </div>
                  ))}
                </div>

                {/* Override credits */}
                <p style={{ color: '#555', fontSize: '11px', marginBottom: '8px' }}>MANUAL OVERRIDE</p>
                <form onSubmit={handleOverride}>
                  <input
                    type="number"
                    placeholder="Amount (use negative to deduct)"
                    value={overrideForm.amount}
                    onChange={(e) => setOverrideForm({ ...overrideForm, amount: e.target.value })}
                    style={{ marginBottom: '8px' }}
                  />
                  <input
                    type="text"
                    placeholder="Reason"
                    value={overrideForm.reason}
                    onChange={(e) => setOverrideForm({ ...overrideForm, reason: e.target.value })}
                    style={{ marginBottom: '8px' }}
                  />
                  <button type="submit" className="danger">Apply Override</button>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Done when:
- [ ] /admin/dashboard loads after admin login
- [ ] Leaderboard shows all 12 teams ranked by coins
- [ ] Table auto-refreshes every 5 seconds
- [ ] Clicking a team shows their detail panel on the right
- [ ] Detail panel shows stages, coins, components, transactions
- [ ] Manual override form works and reflects immediately
- [ ] Logout works

---

## Next task: README-07-dispatch.md
