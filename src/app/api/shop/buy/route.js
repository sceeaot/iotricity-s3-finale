import connectDB from '@/lib/mongodb';
import Component from '@/models/Component';
import Purchase from '@/models/Purchase';
import Team from '@/models/Team';
import Transaction from '@/models/Transaction';
import { requireTeam } from '@/lib/requireAuth';
import { generateReceiptId } from '@/lib/generateReceiptId';
import { isComponentAllowedForTeam, getTeamProjectConfig } from '@/lib/teamProjects';

export async function POST(request) {
  const auth = await requireTeam();
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const rawIds = Array.isArray(body.componentIds) && body.componentIds.length > 0
    ? body.componentIds
    : body.componentId
    ? [body.componentId]
    : [];

  const componentIds = [...new Set(rawIds)].filter(Boolean);

  if (componentIds.length === 0) {
    return Response.json({ error: 'No components specified for purchase.' }, { status: 400 });
  }

  await connectDB();

  const team = await Team.findById(auth.user.id);
  if (!team) return Response.json({ error: 'Team not found' }, { status: 404 });

  const components = await Component.find({ _id: { $in: componentIds } });
  if (components.length !== componentIds.length) {
    return Response.json({ error: 'One or more requested components were not found in catalog.' }, { status: 404 });
  }

  // Anti-cheat verification: Ensure each component belongs to team's assigned project in MongoDB
  const projectConfig = await getTeamProjectConfig(team);
  for (const component of components) {
    if (!isComponentAllowedForTeam(team, component, projectConfig)) {
      return Response.json(
        {
          error: `ACCESS DENIED: Component "${component.name}" is restricted to another team's project specification.`,
        },
        { status: 403 }
      );
    }
  }

  // Check if any component has already been purchased
  const alreadyPurchased = await Purchase.find({
    teamId: team._id,
    componentId: { $in: componentIds },
  });

  if (alreadyPurchased.length > 0) {
    const purchasedNames = alreadyPurchased.map((p) => p.componentName).join(', ');
    return Response.json(
      { error: `The following components have already been purchased: ${purchasedNames}` },
      { status: 400 }
    );
  }

  const totalPrice = components.reduce((sum, c) => sum + c.price, 0);

  // Atomically check and deduct coins
  const charged = await Team.findOneAndUpdate(
    { _id: team._id, coins: { $gte: totalPrice } },
    { $inc: { coins: -totalPrice } },
    { new: true }
  );

  if (!charged) {
    return Response.json(
      {
        error: `Insufficient balance. Total required: ${totalPrice} BC, Available: ${team.coins} BC.`,
      },
      { status: 400 }
    );
  }

  const receiptId = generateReceiptId();
  const purchasedAt = new Date();

  const purchaseDocs = components.map((c) => ({
    receiptId,
    teamId: team._id,
    teamName: team.teamName,
    componentId: c._id,
    componentName: c.name,
    cyberpunkName: c.name, // Use actual component name, no cyberpunk names
    pricePaid: c.price,
    purchasedAt,
    dispatched: false,
  }));

  await Purchase.insertMany(purchaseDocs);

  const componentNamesList = components.map((c) => c.name).join(', ');

  await Transaction.create({
    teamId: team._id,
    type: 'spent',
    amount: -totalPrice,
    reason: `Purchased: ${componentNamesList}`,
  });

  return Response.json({
    success: true,
    receiptId,
    totalPaid: totalPrice,
    itemCount: components.length,
    items: components.map((c) => ({
      _id: c._id,
      name: c.name,
      price: c.price,
    })),
  });
}