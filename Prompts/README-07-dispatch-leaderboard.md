# TASK 07 - Dispatch Queue and Public Leaderboard

## What you are doing
Two things in this task:
1. Admin dispatch page - shows all pending receipts, admin marks them as dispatched
2. Public leaderboard page - teams can see live rankings from their device

---

## API: app/api/admin/dispatch/route.js

GET - fetch all purchases, pending first
POST - mark a receipt as dispatched

```js
import connectDB from '@/lib/mongodb';
import Purchase from '@/models/Purchase';
import { requireAdmin } from '@/lib/requireAuth';

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  await connectDB();

  const purchases = await Purchase.find({}).sort({ dispatched: 1, purchasedAt: -1 });
  return Response.json({ purchases });
}

export async function POST(req) {
  const auth = await requireAdmin();
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  const { receiptId } = await req.json();

  await connectDB();

  await Purchase.updateOne(
    { receiptId },
    { dispatched: true, dispatchedAt: new Date() }
  );

  return Response.json({ success: true });
}
```

---

## Page: app/(admin)/admin/dispatch/page.js

```js
'use client';
import { useEffect, useState } from 'react';

export default function DispatchQueue() {
  const [purchases, setPurchases] = useState([]);
  const [dispatching, setDispatching] = useState(null);

  async function fetchPurchases() {
    const res = await fetch('/api/admin/dispatch');
    const json = await res.json();
    setPurchases(json.purchases || []);
  }

  useEffect(() => {
    fetchPurchases();
    const interval = setInterval(fetchPurchases, 5000);
    return () => clearInterval(interval);
  }, []);

  async function handleDispatch(receiptId) {
    setDispatching(receiptId);
    await fetch('/api/admin/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiptId }),
    });
    setDispatching(null);
    fetchPurchases();
  }

  const pending = purchases.filter((p) => !p.dispatched);
  const done = purchases.filter((p) => p.dispatched);

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '18px' }}>Component Dispatch Queue</h1>
        <a href="/admin/dashboard">Back to Dashboard</a>
      </div>

      <p style={{ color: '#555', fontSize: '11px', marginBottom: '24px' }}>
        auto-refresh 5s - {pending.length} pending
      </p>

      {/* Pending */}
      <p style={{ color: '#ffaa00', fontSize: '12px', marginBottom: '12px' }}>
        PENDING ({pending.length})
      </p>

      {pending.length === 0 ? (
        <p style={{ color: '#333', marginBottom: '32px' }}>No pending dispatches.</p>
      ) : (
        <div style={{ marginBottom: '32px' }}>
          {pending.map((p) => (
            <div key={p._id} style={{
              border: '1px solid #ffaa00',
              padding: '16px',
              marginBottom: '10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>{p.teamName}</p>
                <p style={{ color: '#aaa', fontSize: '13px' }}>{p.cyberpunkName} ({p.componentName})</p>
                <p style={{ color: '#555', fontSize: '11px', marginTop: '4px' }}>
                  Receipt: {p.receiptId}
                </p>
              </div>
              <button
                onClick={() => handleDispatch(p.receiptId)}
                disabled={dispatching === p.receiptId}
              >
                {dispatching === p.receiptId ? 'Marking...' : 'Mark Dispatched'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dispatched */}
      <p style={{ color: '#44ff88', fontSize: '12px', marginBottom: '12px' }}>
        DISPATCHED ({done.length})
      </p>
      <div>
        {done.map((p) => (
          <div key={p._id} style={{
            border: '1px solid #1a1a1a',
            padding: '12px 16px',
            marginBottom: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '13px',
            color: '#555',
          }}>
            <span>{p.teamName} - {p.cyberpunkName}</span>
            <span style={{ color: '#44ff88', fontSize: '11px' }}>dispatched</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## API: app/api/leaderboard/route.js

Public leaderboard - no auth needed, teams can view this.

```js
import connectDB from '@/lib/mongodb';
import Team from '@/models/Team';
import Purchase from '@/models/Purchase';

export async function GET() {
  await connectDB();

  const teams = await Team.find({}).sort({ coins: -1 });

  const leaderboard = await Promise.all(
    teams.map(async (team, index) => {
      const purchases = await Purchase.find({ teamId: team._id });
      return {
        rank: index + 1,
        teamName: team.teamName,
        coins: team.coins,
        stagesCompleted: team.completedStages.length,
        componentsRedeemed: purchases.length,
        status: team.status,
      };
    })
  );

  return Response.json({ leaderboard });
}
```

---

## Page: app/(team)/leaderboard/page.js

```js
'use client';
import { useEffect, useState } from 'react';

export default function Leaderboard() {
  const [data, setData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  async function fetchLeaderboard() {
    const res = await fetch('/api/leaderboard');
    const json = await res.json();
    setData(json.leaderboard || []);
    setLastUpdated(new Date().toLocaleTimeString());
  }

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: '40px', maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', alignItems: 'center' }}>
        <h1 style={{ fontSize: '18px' }}>Live Leaderboard</h1>
        <span style={{ color: '#333', fontSize: '11px' }}>
          {lastUpdated ? `Updated ${lastUpdated}` : ''}
        </span>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Team</th>
            <th>Stages</th>
            <th>Coins</th>
            <th>Parts</th>
          </tr>
        </thead>
        <tbody>
          {data.map((team) => (
            <tr key={team.rank}>
              <td style={{ color: team.rank <= 3 ? '#fff' : '#555' }}>
                {team.rank === 1 ? '1st' : team.rank === 2 ? '2nd' : team.rank === 3 ? '3rd' : team.rank}
              </td>
              <td style={{ fontWeight: team.rank <= 3 ? 'bold' : 'normal' }}>
                {team.teamName}
              </td>
              <td style={{ color: '#aaa' }}>{team.stagesCompleted}/5</td>
              <td>{team.coins} BC</td>
              <td style={{ color: '#aaa' }}>{team.componentsRedeemed}/4</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: '32px' }}>
        <a href="/dashboard">Back to Dashboard</a>
      </div>
    </div>
  );
}
```

---

## Done when:
- [ ] /admin/dispatch shows all pending receipts with yellow border
- [ ] Marking dispatched moves receipt to done section immediately
- [ ] Dispatch queue auto-refreshes every 5 seconds
- [ ] /leaderboard accessible from team dashboard
- [ ] Leaderboard shows all 12 teams ranked by coins
- [ ] Leaderboard auto-refreshes and shows last updated time
- [ ] Top 3 teams visually distinct

---

## Next task: README-08-final-touches.md
