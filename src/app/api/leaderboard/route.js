import connectDB from '@/lib/mongodb';
import Team from '@/models/Team';
import Purchase from '@/models/Purchase';
export async function GET() { await connectDB(); const teams = await Team.find({}).sort({ coins: -1, currentStage: -1 }); const leaderboard = await Promise.all(teams.map(async (team, index) => ({ rank: index + 1, teamName: team.teamName, coins: team.coins, stagesCompleted: team.completedStages.length, componentsRedeemed: await Purchase.countDocuments({ teamId: team._id }), status: team.status }))); return Response.json({ leaderboard }); }