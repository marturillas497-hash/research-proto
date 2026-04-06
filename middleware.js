// middleware.js
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  let response = NextResponse.next({ request });
  const path = request.nextUrl.pathname;

  // 1. SKIP middleware for public assets and LOGIN page to prevent loops
  if (path === '/login' || path.startsWith('/_next') || path.includes('.')) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value, options));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // 2. Protect sensitive routes
  const protectedPaths = ['/dashboard', '/admin', '/submit', '/library'];
  const isProtected = protectedPaths.some(p => path.startsWith(p));

  if (!user && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user) {
    // 3. Database Check (Try to keep this out of middleware if possible, 
    // but if needed, we must handle the login loop)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', user.id)
      .single();

    // Handle non-active status
    if (profile?.status === 'pending' || profile?.status === 'rejected') {
      const errorQuery = profile.status === 'pending' ? 'pending' : 'rejected';
      // Only redirect if NOT already at login (redundant here due to skip above, but safe)
      return NextResponse.redirect(new URL(`/login?error=${errorQuery}`, request.url));
    }

    // Role-Based Access Control
    if (path.startsWith('/admin') && profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Redirect admins away from student dashboard
    if (path.startsWith('/dashboard') && profile?.role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};