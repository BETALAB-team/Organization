import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  const publicPaths = [
    "/login",
    "/api/login",
    "/api/logout",
    "/favicon.ico",
  ];

  const isPublic =
    publicPaths.some((path) => pathname.startsWith(path)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/logo") ||
    pathname.match(/\.(png|jpg|jpeg|svg|ico|webp)$/);

  if (isPublic) {
    return NextResponse.next();
  }

  const hasAccess = req.cookies.get("app_access")?.value === "yes";

  if (!hasAccess) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};