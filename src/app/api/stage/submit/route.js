import connectDB from '@/lib/mongodb';
import Team from '@/models/Team';
import Stage from '@/models/Stage';
import TeamStageState from '@/models/TeamStageState';
import Transaction from '@/models/Transaction';
import { requireTeam } from '@/lib/requireAuth';

export async function POST(request) {
  const auth = await requireTeam();
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  const { answer } = await request.json();
  await connectDB();

  const team = await Team.findById(auth.user.id);
  if (!team) return Response.json({ error: 'Team not found' }, { status: 404 });

  const stageQuery = team.pathId
    ? { pathId: team.pathId, stageNumber: team.currentStage }
    : { stageNumber: team.currentStage };

  let stage = await Stage.findOne(stageQuery).lean();
  if (!stage && team.pathId) {
    stage = await Stage.findOne({ stageNumber: team.currentStage }).lean();
  }
  if (!stage) return Response.json({ error: 'No active stage' }, { status: 400 });

  const state = await TeamStageState.findOne({ teamId: team._id, stageNumber: team.currentStage });
  if (state?.isSolved) return Response.json({ error: 'Stage already solved' }, { status: 400 });

  if (stage.checkpointKey && !state?.isPuzzleUnlocked) {
    return Response.json(
      { error: 'You must decrypt this checkpoint with its security code before submitting an answer.' },
      { status: 400 }
    );
  }

  const normalized = String(answer || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const acceptedAnswers = [stage.correctAnswer, ...(stage.answerAliases || [])].map((value) =>
    String(value).toLowerCase().replace(/[^a-z0-9]/g, '')
  );
  const isCorrect = acceptedAnswers.includes(normalized);

  await TeamStageState.updateOne(
    { teamId: team._id, stageNumber: team.currentStage },
    { $inc: { attempts: 1, ...(isCorrect ? {} : { wrongGuesses: 1 }) } },
    { upsert: true }
  );

  if (!isCorrect) {
    let penaltyMessage = 'Wrong answer. Try again.';
    const penalty = Number(stage.wrongPenalty || 0);
    let updatedCoins = Number(team.coins || 0);

    if (penalty > 0) {
      updatedCoins -= penalty;
      await Team.updateOne({ _id: team._id }, { $inc: { coins: -penalty } });
      await Transaction.create({
        teamId: team._id,
        type: 'spent',
        amount: penalty,
        reason: `Incorrect answer penalty on Stage ${stage.stageNumber} (-${penalty} BC)`,
      });
      penaltyMessage = `Wrong answer! -${penalty} BC penalty applied. Try again.`;
    }

    return Response.json({
      success: false,
      correct: false,
      message: penaltyMessage,
      coins: updatedCoins,
      wrongPenalty: penalty,
      penaltyDeducted: penalty > 0,
    });
  }

  await TeamStageState.updateOne(
    { teamId: team._id, stageNumber: team.currentStage },
    { $set: { isSolved: true, solvedAt: new Date() } }
  );

  const updatedCoins = Number(team.coins || 0) + Number(stage.coinsReward || 0);
  const nextStage = Number(team.currentStage) + 1;

  await Team.updateOne(
    { _id: team._id },
    {
      $set: {
        currentStage: nextStage,
        status: nextStage > 5 ? 'completed' : 'active',
      },
      $inc: { coins: stage.coinsReward },
      $push: { completedStages: stage.stageNumber },
    }
  );

  await Transaction.create({
    teamId: team._id,
    type: 'earned',
    amount: stage.coinsReward,
    reason: `Solved Stage ${stage.stageNumber} - ${stage.title}`,
  });

  return Response.json({
    success: true,
    correct: true,
    message: stage.successMessage || `Stage ${stage.stageNumber} cleared!`,
    coinsEarned: stage.coinsReward,
    coins: updatedCoins,
    nextStage,
    successMessage: stage.successMessage,
  });
}