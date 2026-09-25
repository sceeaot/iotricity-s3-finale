import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/session';
export async function POST(request) {
  const { username, password } = await request.json();
  await connectDB();
  const admin = await Admin.findOne({ username: String(username || '').trim() });
  if (!admin || !(await bcrypt.compare(String(password || ''), admin.password))) return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  const session = await getSession();
  session.user = { id: admin._id.toString(), username: admin.username, role: admin.role };
  await session.save();
  return Response.json({ success: true, role: admin.role });
}