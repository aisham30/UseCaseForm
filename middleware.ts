import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const path = url.pathname;

  // 1. Determine if the path is protected
  const publicRoutes = [
  "/",
  "/login",
  "/forgot-password"
];

const isProtected = !publicRoutes.includes(path);

  if (!isProtected) {
    return NextResponse.next();
  }

  // 2. Read access token from cookies
  const cookies = request.cookies;
  let hasAuthToken = false;

  // Check standard Supabase and custom auth cookie names
  for (const cookie of cookies.getAll()) {
    if (
      cookie.name.includes("auth-token") || 
      cookie.name === "supabase-auth-token" || 
      cookie.name === "formai_mock_session"
    ) {
      hasAuthToken = true;
      break;
    }
  }

  // 3. Centralized Redirect: If no token exists, redirect to login page
  if (!hasAuthToken) {
    url.pathname = "/login";
    // Preserve the original path so the login page knows where to redirect after authentication
    url.searchParams.set("redirectedFrom", path);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Centralized matcher configuration for Next.js App Router
export const config = {
  matcher: [
    "/",
    "/portal/:path*",
    "/review/:path*",
    "/admin/:path*"
  ],
};
