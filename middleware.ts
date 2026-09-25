import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has('iotricity_session');
  if (pathname.startsWith('/admin') && pathname !== '/admin/login' && !hasSession) return NextResponse.redirect(new URL('/admin/login', request.url));
  if (['/dashboard','/shop','/receipt','/leaderboard'].some((path) => pathname.startsWith(path)) && !hasSession) return NextResponse.redirect(new URL('/login', request.url));
  return NextResponse.next();
}
export const config = { matcher: ['/dashboard/:path*','/shop/:path*','/receipt/:path*','/leaderboard/:path*','/admin/:path*'] };