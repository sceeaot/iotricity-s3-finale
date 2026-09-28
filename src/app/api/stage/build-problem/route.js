import connectDB from '@/lib/mongodb';
import BuildProblem from '@/models/BuildProblem';
import { requireTeam } from '@/lib/requireAuth';

export async function GET() {
  const auth = await requireTeam();
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  await connectDB();
  let problem = await BuildProblem.findOne({ pathId: 'path-01' });

  if (!problem) {
    problem = await BuildProblem.findOne();
  }

  return Response.json({ problem });
}
