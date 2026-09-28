import connectDB from '@/lib/mongodb';
import Team from '@/models/Team';
import Stage from '@/models/Stage';
import TeamStageState from '@/models/TeamStageState';
import { requireTeam } from '@/lib/requireAuth';

export async function POST(request) {
  const auth = await requireTeam();
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  const { key } = await request.json();
  await connectDB();

  const team = await Team.findById(auth.user.id);
  if (!team) return Response.json({ error: 'Team not found' }, { status: 404 });

  const stage = await Stage.findOne({ stageNumber: team.currentStage }).lean();
  if (!stage) return Response.json({ error: 'No active stage' }, { status: 400 });

  if (!stage.checkpointKey) {
    return Response.json({ success: true, puzzle: stage.puzzle, isPuzzleUnlocked: true });
  }

  const normalizedInput = String(key || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const normalizedExpected = String(stage.checkpointKey).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (normalizedInput !== normalizedExpected) {
    return Response.json(
      {
        error:
          stage.stageNumber === 2 || stage.stageNumber === 4
            ? 'Invalid secret key. Ensure you have retrieved the correct key from the physical location.'
            : 'Invalid secret key. Check with the field operative after providing the correct passphrase.',
      },
      { status: 400 }
    );
  }

  await TeamStageState.updateOne(
    { teamId: team._id, stageNumber: team.currentStage },
    { $set: { isPuzzleUnlocked: true, isUnlocked: true } },
    { upsert: true }
  );

  return Response.json({
    success: true,
    message: 'Security key accepted! Checkpoint decrypted.',
    puzzle: stage.puzzle,
    isPuzzleUnlocked: true,
  });
}
