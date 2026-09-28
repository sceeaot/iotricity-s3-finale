import connectDB from '@/lib/mongodb';
import Component from '@/models/Component';
import Purchase from '@/models/Purchase';
import Team from '@/models/Team';
import { requireTeam } from '@/lib/requireAuth';
import { isComponentAllowedForTeam, getTeamProjectConfig } from '@/lib/teamProjects';
import componentsData from '@/data/components.json';

export async function GET() {
  const auth = await requireTeam();
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  await connectDB();
  const team = await Team.findById(auth.user.id);
  if (!team) return Response.json({ error: 'Team not found' }, { status: 404 });

  let [components, purchases] = await Promise.all([
    Component.find({}),
    Purchase.find({ teamId: team._id }),
  ]);

  const projectConfig = await getTeamProjectConfig(team);

  const formattedComponents = components.map((c) => {
    const p = purchases.find((x) => x.componentId.toString() === c._id.toString());
    const isAllowed = isComponentAllowedForTeam(team, c, projectConfig);

    return {
      _id: c._id,
      name: c.name,
      cyberpunkName: c.name,
      price: c.price,
      description: c.description,
      category: c.category || 'Module',
      imageUrl: c.imageUrl || '',
      purchased: !!p,
      receiptId: p?.receiptId || null,
      isProjectComponent: isAllowed,
      requiredRole: isAllowed ? 'Assigned Project Component' : 'Restricted (Other Team Project)',
    };
  });

  return Response.json({
    teamCode: team.teamCode,
    teamName: team.teamName,
    teamCoins: team.coins,
    teamProject: projectConfig,
    components: formattedComponents,
  });
}