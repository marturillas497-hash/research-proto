// middleware.js
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  const { pathname, searchParams } = request.nextUrl;

  // 1. PUBLIC ASSET & LOGIN FILTER
  // This is the most important part to prevent the 500 error loop.
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') ||
    pathname === '/login' || 
    pathname === '/favicon.ico' ||
    pathname.includes('.') // Skips all files like .svg, .jpg, etc.
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

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

  // 2. AUTH CHECK
  const { data: { user } } = await supabase.auth.getUser();

  // Protect specific app routes
  const protectedPaths = ['/dashboard', '/admin', '/submit', '/library', '/profile'];
  const isProtected = protectedPaths.some(p => pathname.startsWith(p));

  if (!user && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. ROLE & STATUS LOGIC
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', user.id)
      .single();

    // Check for Pending/Rejected status
    if (profile?.status === 'pending' || profile?.status === 'rejected') {
      const url = new URL('/login', request.url);
      url.searchParams.set('error', profile.status);
      return NextResponse.redirect(url);
    }

    // Role-Based Protection
    if (pathname.startsWith('/admin') && profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (pathname.startsWith('/dashboard') && profile?.role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return response;
}

export const config = {
  // This matcher ensures the middleware only runs on actual page routes
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};