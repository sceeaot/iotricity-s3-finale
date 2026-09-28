import connectDB from '@/lib/mongodb';
import Purchase from '@/models/Purchase';
import { requireAdmin } from '@/lib/requireAuth';

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });
  await connectDB();
  const purchases = await Purchase.find({}).sort({ dispatched: 1, purchasedAt: -1 }).lean();
  return Response.json({ purchases });
}

export async function POST(request) {
  const auth = await requireAdmin();
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });
  const { receiptId } = await request.json();
  await connectDB();
  await Purchase.updateMany(
    { receiptId },
    { dispatched: true, dispatchedAt: new Date() }
  );
  return Response.json({ success: true });
}