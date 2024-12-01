import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isAuthenticated = !!token;

  // Define public paths that don't require authentication
  const publicPaths = ["/login", "/register"];
  const isPublicPath = publicPaths.includes(request.nextUrl.pathname);

  if (isPublicPath && isAuthenticated) {
    return NextResponse.redirect(new URL("/habits", request.url));
  }

  if (!isPublicPath && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/habits/:path*", "/preferences/:path*", "/login", "/register"],
}; 