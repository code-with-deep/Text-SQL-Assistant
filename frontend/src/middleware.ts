import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isTokenValid(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Base64Url decode using standard Web APIs (atob is available in Edge Runtime)
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const payload = JSON.parse(jsonPayload);
    // Add a small 1-minute buffer to prevent edge cases
    const currentTime = Math.floor(Date.now() / 1000) + 60;
    
    return payload.exp > currentTime;
  } catch (e) {
    return false; // Treat as invalid if parsing fails
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Extract token from cookie
  const refreshTokenCookie = request.cookies.get('refresh_token');
  const tokenValue = refreshTokenCookie?.value;
  const hasValidToken = tokenValue ? isTokenValid(tokenValue) : false;

  // Define route categories
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isAuthRoute = pathname === '/login' || pathname === '/register';

  // 1. If trying to access dashboard routes WITHOUT a VALID session, redirect to login
  if (isDashboardRoute && !hasValidToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    
    const response = NextResponse.redirect(loginUrl);
    // Proactively clean up the stale cookie so the browser drops it
    if (tokenValue) {
      response.cookies.delete('refresh_token');
    }
    return response;
  }

  // 2. If trying to access login/register WITH a VALID session, redirect to dashboard
  if (isAuthRoute) {
    const isForcedLogout = request.nextUrl.searchParams.has('callbackUrl');
    
    if (hasValidToken && !isForcedLogout) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else if (tokenValue) {
      // The token exists but is invalid/expired or we are forcing a logout. Clear the bad cookie!
      const response = NextResponse.next();
      response.cookies.delete('refresh_token');
      return response;
    }
  }

  const response = NextResponse.next();

  // Add no-store Cache-Control headers for authenticated routes to prevent bfcache leaks
  if (isDashboardRoute) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  return response;
}

// Config to specify which paths the middleware runs on
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/register'
  ]
};
