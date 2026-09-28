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
  if (!team) return Response.json({ error: 'Team not found' }, { status: 404 });

  if (!team.startTime) {
    await Team.updateOne({ _id: team._id }, { startTime: new Date(), status: 'active' });
  }

  const stage = await Stage.findOne({ stageNumber: team.currentStage }).lean();
  if (!stage) {
    return Response.json({
      completed: true,
      coins: team.coins,
      teamCoins: team.coins,
      completedStages: team.completedStages,
      teamName: team.teamName,
      successMessage:
        'Mission complete. All 5 data fragments recovered. Breach Credits available for component redemption. Proceed to the component shop and bring the grid online.',
    });
  }

  let state = await TeamStageState.findOne({ teamId: team._id, stageNumber: team.currentStage });
  if (!state) {
    state = await TeamStageState.create({
      teamId: team._id,
      stageNumber: team.currentStage,
      isUnlocked: !stage.checkpointKey,
      isPuzzleUnlocked: !stage.checkpointKey,
    });
  }

  const requiresKey = Boolean(stage.checkpointKey && stage.checkpointKey.trim().length > 0);
  const isPuzzleUnlocked = !requiresKey || Boolean(state.isPuzzleUnlocked);

  return Response.json({
    teamName: team.teamName,
    stageNumber: stage.stageNumber,
    title: stage.title,
    type: stage.type || 'Direct',
    location: stage.location || '',
    message: stage.message,
    puzzle: isPuzzleUnlocked ? stage.puzzle : null,
    requiresKey,
    isPuzzleUnlocked,
    coinsReward: stage.coinsReward,
    wrongPenalty: stage.wrongPenalty || 0,
    hints: stage.hints.map((hint, index) => ({
      index,
      cost: hint.cost,
      revealed: state.hintsRevealed.includes(index),
      text: state.hintsRevealed.includes(index) ? hint.text : null,
    })),
    attempts: state.attempts,
    completedStages: team.completedStages,
    currentStage: team.currentStage,
    teamCoins: team.coins,
  });
}