import connectDB from '@/lib/mongodb';
import Team from '@/models/Team';
import Stage from '@/models/Stage';
import BuildProblem from '@/models/BuildProblem';
import TeamStageState from '@/models/TeamStageState';
import { requireTeam } from '@/lib/requireAuth';
import { populateBuildProblemComponents } from '@/lib/teamProjects';

export async function GET() {
  const auth = await requireTeam();
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  await connectDB();
  const team = await Team.findById(auth.user.id);
  if (!team) return Response.json({ error: 'Team not found' }, { status: 404 });

  if (!team.startTime) {
    await Team.updateOne({ _id: team._id }, { startTime: new Date(), status: 'active' });
  }

  const stageQuery = team.pathId
    ? { pathId: team.pathId, stageNumber: team.currentStage }
    : { stageNumber: team.currentStage };

  let stage = await Stage.findOne(stageQuery).lean();
  if (!stage && team.pathId) {
    stage = await Stage.findOne({ stageNumber: team.currentStage }).lean();
  }

  const problemQuery = team.pathId ? { pathId: team.pathId } : {};
  let buildProblem = await BuildProblem.findOne(problemQuery).lean();
  if (!buildProblem) {
    buildProblem = await BuildProblem.findOne().lean();
  }
  buildProblem = await populateBuildProblemComponents(buildProblem);

  if (!stage) {
    return Response.json({
      completed: true,
      coins: team.coins,
      teamCoins: team.coins,
      completedStages: team.completedStages,
      teamName: team.teamName,
      buildProblem,
      successMessage:
        buildProblem?.allStagesCompleteMessage ||
        'Mission complete. All fragments recovered. Breach Credits available for component redemption. Proceed to the component shop.',
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
    hints: (stage.hints || []).map((hint, index) => ({
      index,
      cost: hint.cost,
      revealed: (state.hintsRevealed || []).includes(index),
      text: (state.hintsRevealed || []).includes(index) ? hint.text : null,
    })),
    attempts: state.attempts,
    completedStages: team.completedStages,
    currentStage: team.currentStage,
    teamCoins: team.coins,
    buildProblem,
  });
}