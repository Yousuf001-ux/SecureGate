import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Air-tight Server-Side Middleware Guard.
 * Enforces route-level access control BEFORE any page rendering occurs.
 */
export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // 1. Dashboard Protection Rule
  if (pathname.startsWith("/dashboard")) {
    // If no session exists, redirect to login
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }

    // If authenticated but emailVerified is null, redirect to verify-required
    if (token.emailVerified === null || token.emailVerified === undefined) {
      const verifyRequiredUrl = new URL("/verify-required", req.url);
      return NextResponse.redirect(verifyRequiredUrl);
    }
  }

  // 2. Verify Required Page Protection Rule
  if (pathname.startsWith("/verify-required")) {
    // If not logged in, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    // If already verified, direct straight to dashboard
    if (token.emailVerified !== null && token.emailVerified !== undefined) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // 3. Auth Page Redirection Rules (Login / Signup)
  if (pathname.startsWith("/login") || pathname.startsWith("/signup")) {
    if (token) {
      // If user is verified, send to dashboard
      if (token.emailVerified !== null && token.emailVerified !== undefined) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      } else {
        // If unverified, keep them at the verification screen
        return NextResponse.redirect(new URL("/verify-required", req.url));
      }
    }
  }

  return NextResponse.next();
}

/**
 * Configure matching routes for middleware intercept.
 */
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/verify-required",
    "/login",
    "/signup",
  ],
};
