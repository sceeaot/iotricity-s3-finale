import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
const password = process.env.NEXTAUTH_SECRET || 'local-development-secret-change-me-32';
export const sessionOptions = { password, cookieName: 'iotricity_session', cookieOptions: { secure: process.env.NODE_ENV === 'production', httpOnly: true, sameSite: 'lax' } };
export async function getSession() { return getIronSession(await cookies(), sessionOptions); }