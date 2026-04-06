// middleware.js
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Only skip static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              request.cookies.set(name, value, options)
            );
            response = NextResponse.next({
              request: { headers: request.headers },
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Refresh session — critical for navbar to work
    const { data: { user } } = await supabase.auth.getUser();

    const protectedPaths = ['/dashboard', '/admin', '/submit', '/library', '/profile', '/adviser'];
    const isProtected = protectedPaths.some(p => pathname.startsWith(p));

    if (!user && isProtected) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', user.id)
        .single();

      // Pending/Rejected — redirect to login with error
      if (profile?.status === 'pending' || profile?.status === 'rejected') {
        const url = new URL('/login', request.url);
        url.searchParams.set('error', profile.status);
        return NextResponse.redirect(url);
      }

      // Role-based guards
      if (pathname.startsWith('/admin') && profile?.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      if (pathname.startsWith('/adviser') && profile?.role !== 'research_adviser') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      if (pathname.startsWith('/dashboard') && profile?.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }

      // Redirect active users away from login
      if (pathname === '/login' && profile?.status === 'active') {
        const dest = profile.role === 'admin' ? '/admin' :
                     profile.role === 'research_adviser' ? '/adviser' : '/dashboard';
        return NextResponse.redirect(new URL(dest, request.url));
      }
    }
  } catch (error) {
    console.error('Middleware Error:', error);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};