import connectDB from '@/lib/mongodb';
import Team from '@/models/Team';
import { getSession } from '@/lib/session';
export async function POST(request) {
  const { teamCode } = await request.json();
  await connectDB();
  const team = await Team.findOne({ teamCode: String(teamCode || '').trim().toUpperCase() });
  if (!team) return Response.json({ error: 'Invalid team code' }, { status: 401 });
  const session = await getSession();
  session.user = { id: team._id.toString(), teamName: team.teamName, role: 'team' };
  await session.save();
  return Response.json({ success: true, teamName: team.teamName });
}