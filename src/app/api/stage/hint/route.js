import connectDB from '@/lib/mongodb';
import Team from '@/models/Team';
import Stage from '@/models/Stage';
import TeamStageState from '@/models/TeamStageState';
import Transaction from '@/models/Transaction';
import { requireTeam } from '@/lib/requireAuth';
export async function POST(request) {
  const auth = await requireTeam(); if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });
  const { hintIndex } = await request.json(); await connectDB(); const team = await Team.findById(auth.user.id); const stage = await Stage.findOne({ stageNumber: team.currentStage }); const hint = stage?.hints[hintIndex];
  if (!hint) return Response.json({ error: 'Hint not found' }, { status: 404 });
  const state = await TeamStageState.findOne({ teamId: team._id, stageNumber: team.currentStage });
  if (state?.hintsRevealed.includes(hintIndex)) return Response.json({ error: 'Hint already revealed' }, { status: 400 });
  const updated = await Team.findOneAndUpdate({ _id: team._id, coins: { $gte: hint.cost } }, { $inc: { coins: -hint.cost } }, { new: true });
  if (!updated) return Response.json({ error: 'Not enough coins' }, { status: 400 });
  await TeamStageState.updateOne({ teamId: team._id, stageNumber: team.currentStage }, { $push: { hintsRevealed: hintIndex } }, { upsert: true });
  await Transaction.create({ teamId: team._id, type: 'hint', amount: -hint.cost, reason: `Hint ${hintIndex + 1} used at Stage ${team.currentStage}` });
  return Response.json({ success: true, hintText: hint.text, costDeducted: hint.cost });
}