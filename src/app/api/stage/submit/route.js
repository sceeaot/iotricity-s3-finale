import connectDB from '@/lib/mongodb';
import Team from '@/models/Team';
import Stage from '@/models/Stage';
import TeamStageState from '@/models/TeamStageState';
import Transaction from '@/models/Transaction';
import { requireTeam } from '@/lib/requireAuth';
export async function POST(request) {
  const auth = await requireTeam(); if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });
  const { answer } = await request.json(); await connectDB();
  const team = await Team.findById(auth.user.id); const stage = await Stage.findOne({ stageNumber: team.currentStage });
  if (!stage) return Response.json({ error: 'No active stage' }, { status: 400 });
  const state = await TeamStageState.findOne({ teamId: team._id, stageNumber: team.currentStage });
  if (state?.isSolved) return Response.json({ error: 'Stage already solved' }, { status: 400 });
  const normalized = String(answer || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const acceptedAnswers = [stage.correctAnswer, ...(stage.answerAliases || [])].map((value) => String(value).toLowerCase().replace(/[^a-z0-9]/g, ''));
  const isCorrect = acceptedAnswers.includes(normalized);
  await TeamStageState.updateOne({ teamId: team._id, stageNumber: team.currentStage }, { $inc: { attempts: 1, ...(isCorrect ? {} : { wrongGuesses: 1 }) } }, { upsert: true });
  if (!isCorrect) return Response.json({ correct: false, message: 'Wrong answer. Try again.' });
  const nextStage = team.currentStage + 1; const completed = nextStage > 5;
  await TeamStageState.updateOne({ teamId: team._id, stageNumber: team.currentStage }, { isSolved: true, solvedAt: new Date() });
  await Team.updateOne({ _id: team._id }, { $inc: { coins: stage.coinsReward }, $push: { completedStages: stage.stageNumber }, $set: { currentStage: nextStage, ...(completed ? { status: 'completed' } : {}) } });
  await Transaction.create({ teamId: team._id, type: 'earned', amount: stage.coinsReward, reason: `Solved Stage ${stage.stageNumber} - ${stage.title}` });
  return Response.json({ correct: true, coinsEarned: stage.coinsReward, nextStage, completed, successMessage: stage.successMessage });
}