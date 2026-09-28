import mongoose from 'mongoose';

let cached = globalThis.__mongoose;
if (!cached) cached = globalThis.__mongoose = { conn: null, promise: null };
export default async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not configured. Add it to .env.local.');
  if (cached.conn) return cached.conn;
  if (!cached.promise) cached.promise = mongoose.connect(uri, { dbName: process.env.MONGODB_DB || 'iotricity' });
  cached.conn = await cached.promise;
  return cached.conn;
}