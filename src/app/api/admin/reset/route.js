import connectDB from '@/lib/mongodb';
import Team from '@/models/Team';
import TeamStageState from '@/models/TeamStageState';
import Purchase from '@/models/Purchase';
import Transaction from '@/models/Transaction';
import { requireAdmin } from '@/lib/requireAuth';

export async function POST(request) {
  const auth = await requireAdmin();
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  const { teamId, reason } = await request.json();
  if (!teamId) return Response.json({ error: 'Team ID is required' }, { status: 400 });

  await connectDB();
  const team = await Team.findById(teamId);
  if (!team) return Response.json({ error: 'Team not found' }, { status: 404 });

  await Team.updateOne(
    { _id: team._id },
    {
      $set: {
        coins: 0,
        currentStage: 1,
        completedStages: [],
        status: 'waiting',
        startTime: null,
      },
    }
  );

  await TeamStageState.deleteMany({ teamId: team._id });
  await Purchase.deleteMany({ teamId: team._id });
  await Transaction.deleteMany({ teamId: team._id });
  await Transaction.create({
    teamId: team._id,
    type: 'reset',
    amount: 0,
    reason: reason || 'Manual reset to zero by admin',
  });

  return Response.json({ success: true, message: 'Team reset to zero progress.' });
}
