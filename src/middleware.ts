import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Allow access to all auth-related pages without redirection
  if (req.nextUrl.pathname === '/auth' || req.nextUrl.pathname.startsWith('/auth/')) {
    return res;
  }

  // Redirect to auth page if not authenticated and trying to access protected routes
  if (!session) {
    return NextResponse.redirect(new URL('/auth', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}; 