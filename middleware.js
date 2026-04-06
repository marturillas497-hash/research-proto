// middleware.js
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // 1. EXIT EARLY: Skip internal Next.js, static files, and the login page
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') ||
    pathname === '/login' || 
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Create an unmodified response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              request.cookies.set(name, value, options)
            );
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // 2. AUTH CHECK
    const { data: { user } } = await supabase.auth.getUser();

    const protectedPaths = ['/dashboard', '/admin', '/submit', '/library', '/profile'];
    const isProtected = protectedPaths.some(p => pathname.startsWith(p));

    if (!user && isProtected) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // 3. PROFILE CHECK (Only if logged in)
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', user.id)
        .single();

      // Handle Pending/Rejected status
      if (profile?.status === 'pending' || profile?.status === 'rejected') {
        const url = new URL('/login', request.url);
        url.searchParams.set('error', profile.status);
        return NextResponse.redirect(url);
      }

      // Admin Protection
      if (pathname.startsWith('/admin') && profile?.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      // Student/Adviser Protection (Redirect away from /admin)
      if (pathname.startsWith('/dashboard') && profile?.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    }
  } catch (error) {
    // If something fails, we log it and let the request continue to avoid a 500
    console.error('Middleware Error:', error);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};