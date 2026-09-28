import connectDB from '@/lib/mongodb';
import Purchase from '@/models/Purchase';
import Component from '@/models/Component';
import { requireTeam } from '@/lib/requireAuth';
import mongoose from 'mongoose';

export async function GET(request, { params }) {
  const auth = await requireTeam();
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  await connectDB();
  const { id } = await params;

  let purchases = await Purchase.find({ receiptId: id }).populate('componentId').lean();

  if (!purchases || purchases.length === 0) {
    if (mongoose.Types.ObjectId.isValid(id)) {
      const single = await Purchase.findById(id).populate('componentId').lean();
      if (single) purchases = [single];
    }
  }

  if (!purchases || purchases.length === 0) {
    return Response.json({ error: 'Receipt not found' }, { status: 404 });
  }

  const first = purchases[0];
  if (first.teamId.toString() !== auth.user.id && auth.user.role !== 'admin') {
    return Response.json({ error: 'Unauthorized to view this receipt' }, { status: 403 });
  }

  const totalPaid = purchases.reduce((sum, p) => sum + p.pricePaid, 0);
  const allDispatched = purchases.every((p) => p.dispatched);
  const dispatchedAt = purchases.find((p) => p.dispatchedAt)?.dispatchedAt || null;

  const items = purchases.map((p) => {
    const comp = p.componentId || {};
    return {
      _id: p._id,
      componentId: comp._id || p.componentId,
      componentName: p.componentName || comp.name || 'Component Module',
      pricePaid: p.pricePaid,
      category: comp.category || 'Module',
      imageUrl: comp.imageUrl || '',
      description: comp.description || '',
      dispatched: p.dispatched,
      dispatchedAt: p.dispatchedAt,
    };
  });

  const receiptData = {
    receiptId: first.receiptId,
    teamId: first.teamId,
    teamName: first.teamName,
    purchasedAt: first.purchasedAt,
    dispatched: allDispatched,
    dispatchedAt,
    totalPaid,
    itemCount: items.length,
    items,
  };

  return Response.json({
    receipt: receiptData,
    purchase: {
      receiptId: first.receiptId,
      teamName: first.teamName,
      componentName: items.map((i) => i.componentName).join(', '),
      pricePaid: totalPaid,
      purchasedAt: first.purchasedAt,
      dispatched: allDispatched,
      dispatchedAt,
      items,
    },
  });
}