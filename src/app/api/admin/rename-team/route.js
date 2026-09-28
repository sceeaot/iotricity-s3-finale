import connectDB from '@/lib/mongodb';
import Team from '@/models/Team';
import Purchase from '@/models/Purchase';
import { requireAdmin } from '@/lib/requireAuth';

export async function POST(request) {
  const auth = await requireAdmin();
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  const { teamId, newTeamName } = await request.json();
  const trimmedName = typeof newTeamName === 'string' ? newTeamName.trim() : '';

  if (!teamId || !trimmedName) {
    return Response.json({ error: 'Team ID and a valid team name are required.' }, { status: 400 });
  }

  if (trimmedName.length < 2 || trimmedName.length > 50) {
    return Response.json({ error: 'Team name must be between 2 and 50 characters.' }, { status: 400 });
  }

  await connectDB();
  const team = await Team.findById(teamId);
  if (!team) {
    return Response.json({ error: 'Team not found.' }, { status: 404 });
  }

  // Check if another team is already using this exact name
  const existing = await Team.findOne({
    _id: { $ne: teamId },
    teamName: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
  });

  if (existing) {
    return Response.json({ error: 'Another squad is already using this callsign.' }, { status: 409 });
  }

  await Team.updateOne({ _id: teamId }, { $set: { teamName: trimmedName } });
  await Purchase.updateMany({ teamId }, { $set: { teamName: trimmedName } });

  return Response.json({ success: true, teamName: trimmedName });
}
