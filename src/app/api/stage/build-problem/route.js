import connectDB from '@/lib/mongodb';
import BuildProblem from '@/models/BuildProblem';
import Team from '@/models/Team';
import { requireTeam } from '@/lib/requireAuth';
import { populateBuildProblemComponents } from '@/lib/teamProjects';

export async function GET() {
  const auth = await requireTeam();
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  await connectDB();
  const team = await Team.findById(auth.user.id);
  const pathId = team?.pathId;

  let problem = null;
  if (pathId) {
    problem = await BuildProblem.findOne({ pathId }).lean();
  }
  if (!problem) {
    problem = await BuildProblem.findOne().lean();
  }

  problem = await populateBuildProblemComponents(problem);

  return Response.json({ problem });
}
