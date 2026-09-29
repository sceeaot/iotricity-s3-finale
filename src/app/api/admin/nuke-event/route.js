import connectDB from '@/lib/mongodb';
import Team from '@/models/Team';
import TeamStageState from '@/models/TeamStageState';
import Purchase from '@/models/Purchase';
import Transaction from '@/models/Transaction';
import { requireAdmin } from '@/lib/requireAuth';

export async function POST(request) {
  const auth = await requireAdmin();
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  await connectDB();

  // Reset all teams' game progression to initial event state
  const teamUpdateResult = await Team.updateMany(
    {},
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

  // Delete all team stage states so everyone starts fresh at stage 1
  const stageStateResult = await TeamStageState.deleteMany({});

  // Delete all component purchases
  const purchaseResult = await Purchase.deleteMany({});

  // Delete all transactions
  const transactionResult = await Transaction.deleteMany({});

  return Response.json({
    success: true,
    message: 'Global event reset executed. All team progress wiped cleanly.',
    details: {
      teamsReset: teamUpdateResult.modifiedCount ?? teamUpdateResult.matchedCount,
      stageStatesDeleted: stageStateResult.deletedCount,
      purchasesDeleted: purchaseResult.deletedCount,
      transactionsDeleted: transactionResult.deletedCount,
    },
  });
}
