// middleware.js
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
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

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // Protect sensitive routes [cite: 172-182]
  const protectedPaths = ['/dashboard', '/adviser', '/admin', '/submit', '/library'];
  const isProtected = protectedPaths.some(p => path.startsWith(p));

  if (!user && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', user.id)
      .single();

    // 1. Handle Approval Status [cite: 153, 154]
    if (profile?.status === 'pending' && path !== '/login') {
      return NextResponse.redirect(new URL('/login?error=pending', request.url));
    }
    if (profile?.status === 'rejected' && path !== '/login') {
      return NextResponse.redirect(new URL('/login?error=rejected', request.url));
    }

    // 2. Role-Based Redirects [cite: 155, 156, 157]
    if (path.startsWith('/admin') && profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    if (path.startsWith('/adviser') && profile?.role !== 'research_adviser') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    if (path === '/login' && profile?.status === 'active') {
      const dest = profile.role === 'admin' ? '/admin' : profile.role === 'research_adviser' ? '/adviser' : '/dashboard';
      return NextResponse.redirect(new URL(dest, request.url));
    }

    if (path.startsWith('/dashboard') && profile?.role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    if (path === '/login' && profile?.status === 'active') {
      const dest = profile.role === 'admin' ? '/admin' : 
                  profile.role === 'research_adviser' ? '/adviser' : '/dashboard';
      return NextResponse.redirect(new URL(dest, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};