# TASK 04 - Stage System

## What you are doing
The core loop of the app. Team dashboard shows current stage, message,
answer input, and hints. Submitting correct answer gives coins and unlocks
next stage. Hints cost coins.

---

## API: app/api/stage/current/route.js

Returns the current active stage and its state for the logged-in team.

```js
import connectDB from '@/lib/mongodb';
import Team from '@/models/Team';
import Stage from '@/models/Stage';
import TeamStageState from '@/models/TeamStageState';
import { requireTeam } from '@/lib/requireAuth';

export async function GET() {
  const auth = await requireTeam();
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  await connectDB();

  const team = await Team.findById(auth.user.id);
  const stage = await Stage.findOne({ stageNumber: team.currentStage });

  if (!stage) {
    return Response.json({ completed: true, coins: team.coins });
  }

  let stageState = await TeamStageState.findOne({
    teamId: team._id,
    stageNumber: team.currentStage,
  });

  if (!stageState) {
    stageState = await TeamStageState.create({
      teamId: team._id,
      stageNumber: team.currentStage,
      isUnlocked: true,
    });
  }

  // Only send revealed hint texts, keep others locked
  const hints = stage.hints.map((hint, index) => ({
    index,
    cost: hint.cost,
    revealed: stageState.hintsRevealed.includes(index),
    text: stageState.hintsRevealed.includes(index) ? hint.text : null,
  }));

  return Response.json({
    stageNumber: stage.stageNumber,
    title: stage.title,
    message: stage.message,
    coinsReward: stage.coinsReward,
    hints,
    attempts: stageState.attempts,
    isSolved: stageState.isSolved,
    teamCoins: team.coins,
    completedStages: team.completedStages,
    currentStage: team.currentStage,
  });
}
```

---

## API: app/api/stage/submit/route.js

```js
import connectDB from '@/lib/mongodb';
import Team from '@/models/Team';
import Stage from '@/models/Stage';
import TeamStageState from '@/models/TeamStageState';
import Transaction from '@/models/Transaction';
import { requireTeam } from '@/lib/requireAuth';

export async function POST(req) {
  const auth = await requireTeam();
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  const { answer } = await req.json();

  await connectDB();

  const team = await Team.findById(auth.user.id);
  const stage = await Stage.findOne({ stageNumber: team.currentStage });

  if (!stage) {
    return Response.json({ error: 'No active stage' }, { status: 400 });
  }

  const stageState = await TeamStageState.findOne({
    teamId: team._id,
    stageNumber: team.currentStage,
  });

  if (stageState?.isSolved) {
    return Response.json({ error: 'Stage already solved' }, { status: 400 });
  }

  // Increment attempts
  await TeamStageState.updateOne(
    { teamId: team._id, stageNumber: team.currentStage },
    { $inc: { attempts: 1 } }
  );

  const correct =
    answer.trim().toLowerCase() === stage.correctAnswer.trim().toLowerCase();

  if (!correct) {
    return Response.json({ correct: false, message: 'Wrong answer. Try again.' });
  }

  // Mark solved
  await TeamStageState.updateOne(
    { teamId: team._id, stageNumber: team.currentStage },
    { isSolved: true, solvedAt: new Date() }
  );

  // Add coins
  await Team.updateOne(
    { _id: team._id },
    {
      $inc: { coins: stage.coinsReward },
      $push: { completedStages: stage.stageNumber },
      $set: { currentStage: team.currentStage + 1 },
    }
  );

  // Log transaction
  await Transaction.create({
    teamId: team._id,
    type: 'earned',
    amount: stage.coinsReward,
    reason: `Solved Stage ${stage.stageNumber} - ${stage.title}`,
  });

  const allStages = 5;
  const isCompleted = team.currentStage >= allStages;

  if (isCompleted) {
    await Team.updateOne({ _id: team._id }, { status: 'completed' });
  }

  return Response.json({
    correct: true,
    coinsEarned: stage.coinsReward,
    nextStage: team.currentStage + 1,
    completed: isCompleted,
  });
}
```

---

## API: app/api/stage/hint/route.js

```js
import connectDB from '@/lib/mongodb';
import Team from '@/models/Team';
import Stage from '@/models/Stage';
import TeamStageState from '@/models/TeamStageState';
import Transaction from '@/models/Transaction';
import { requireTeam } from '@/lib/requireAuth';

export async function POST(req) {
  const auth = await requireTeam();
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  const { hintIndex } = await req.json();

  await connectDB();

  const team = await Team.findById(auth.user.id);
  const stage = await Stage.findOne({ stageNumber: team.currentStage });
  const hint = stage.hints[hintIndex];

  if (!hint) {
    return Response.json({ error: 'Hint not found' }, { status: 404 });
  }

  const stageState = await TeamStageState.findOne({
    teamId: team._id,
    stageNumber: team.currentStage,
  });

  if (stageState.hintsRevealed.includes(hintIndex)) {
    return Response.json({ error: 'Hint already revealed' }, { status: 400 });
  }

  if (team.coins < hint.cost) {
    return Response.json({ error: 'Not enough coins' }, { status: 400 });
  }

  // Deduct coins
  await Team.updateOne({ _id: team._id }, { $inc: { coins: -hint.cost } });

  // Mark hint revealed
  await TeamStageState.updateOne(
    { teamId: team._id, stageNumber: team.currentStage },
    { $push: { hintsRevealed: hintIndex } }
  );

  // Log transaction
  await Transaction.create({
    teamId: team._id,
    type: 'hint',
    amount: -hint.cost,
    reason: `Hint ${hintIndex + 1} used at Stage ${team.currentStage}`,
  });

  return Response.json({ success: true, hintText: hint.text, costDeducted: hint.cost });
}
```

---

## Page: app/(team)/dashboard/page.js

```js
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [answer, setAnswer] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function fetchStage() {
    const res = await fetch('/api/stage/current');
    if (res.status === 401) { router.push('/login'); return; }
    const json = await res.json();
    setData(json);
  }

  useEffect(() => { fetchStage(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const res = await fetch('/api/stage/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer }),
    });

    const json = await res.json();
    setLoading(false);

    if (json.correct) {
      setMessage(`Correct! +${json.coinsEarned} BC earned.`);
      setAnswer('');
      setTimeout(() => fetchStage(), 1000);
    } else {
      setMessage(json.message || json.error);
    }
  }

  async function handleHint(hintIndex, cost) {
    const confirmed = confirm(`Use hint for ${cost} BC?`);
    if (!confirmed) return;

    const res = await fetch('/api/stage/hint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hintIndex }),
    });

    const json = await res.json();
    if (json.success) {
      fetchStage();
    } else {
      alert(json.error);
    }
  }

  if (!data) return <div style={{ padding: '40px' }}>Loading...</div>;

  if (data.completed) {
    return (
      <div style={{ padding: '40px' }}>
        <h2>All stages completed.</h2>
        <p style={{ color: '#888' }}>Coins: {data.coins} BC</p>
        <br />
        <a href="/shop">Go to Component Shop</a>
      </div>
    );
  }

  // Stage progress bar
  const stages = [1, 2, 3, 4, 5];

  return (
    <div style={{ padding: '40px', maxWidth: '700px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '20px' }}>IoTRICITY S3</h1>
        <span style={{ color: '#aaa' }}>Coins: <strong style={{ color: '#fff' }}>{data.teamCoins} BC</strong></span>
      </div>

      {/* Stage progress */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
        {stages.map((s) => (
          <div key={s} style={{
            flex: 1,
            padding: '8px',
            textAlign: 'center',
            border: '1px solid #333',
            backgroundColor: data.completedStages.includes(s)
              ? '#fff'
              : s === data.currentStage
              ? '#222'
              : '#000',
            color: data.completedStages.includes(s) ? '#000' : '#fff',
            fontSize: '12px',
          }}>
            {data.completedStages.includes(s) ? `✓ S${s}` : `S${s}`}
          </div>
        ))}
      </div>

      {/* Current stage */}
      <div style={{ border: '1px solid #333', padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '8px', fontSize: '16px' }}>{data.title}</h2>
        <p style={{ color: '#ccc', lineHeight: '1.6', marginBottom: '0' }}>{data.message}</p>
      </div>

      {/* Answer form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Enter your answer"
          style={{ marginBottom: '12px' }}
          required
        />
        {message && (
          <p style={{
            marginBottom: '12px',
            color: message.startsWith('Correct') ? '#44ff88' : '#ff4444'
          }}>
            {message}
          </p>
        )}
        <button type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Submitting...' : 'Submit Answer'}
        </button>
      </form>

      {/* Hints */}
      <div>
        <p style={{ color: '#555', marginBottom: '12px', fontSize: '12px' }}>HINTS</p>
        {data.hints.map((hint, i) => (
          <div key={i} style={{
            border: '1px solid #222',
            padding: '12px',
            marginBottom: '8px',
          }}>
            {hint.revealed ? (
              <p style={{ color: '#aaa' }}>{hint.text}</p>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#555' }}>Hint {i + 1} - locked</span>
                <button
                  onClick={() => handleHint(hint.index, hint.cost)}
                  style={{ backgroundColor: '#000', color: '#fff', border: '1px solid #555', padding: '4px 12px', fontSize: '12px' }}
                >
                  Unlock ({hint.cost} BC)
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Nav */}
      <div style={{ marginTop: '32px', display: 'flex', gap: '16px' }}>
        <a href="/shop">Component Shop</a>
        <a href="/leaderboard">Leaderboard</a>
      </div>
    </div>
  );
}
```

---

## Done when:
- [ ] /dashboard loads and shows current stage for logged-in team
- [ ] Stage progress bar shows completed vs active stages
- [ ] Submitting correct answer shows success, adds coins, moves to next stage
- [ ] Submitting wrong answer shows error message
- [ ] Unlocking a hint deducts coins and reveals hint text
- [ ] Completing all 5 stages shows completion message
- [ ] Coins update live after each action

---

## Next task: README-05-shop.md
