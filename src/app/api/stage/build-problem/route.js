import connectDB from '@/lib/mongodb';
import BuildProblem from '@/models/BuildProblem';
import Team from '@/models/Team';
import { requireTeam } from '@/lib/requireAuth';

export async function GET() {
  const auth = await requireTeam();
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  await connectDB();
  const team = await Team.findById(auth.user.id);
  const pathId = team?.pathId;

  let problem = null;
  if (pathId) {
    problem = await BuildProblem.findOne({ pathId });
  }
  if (!problem) {
    problem = await BuildProblem.findOne();
  }

  return Response.json({ problem });
}
