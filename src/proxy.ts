import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/register"];
const APP_PREFIX = "/app";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has("nexus_session");

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isAppPath = pathname.startsWith(APP_PREFIX);

  // Redirect authenticated users away from auth pages
  if (isPublicPath && hasSession) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  // Redirect unauthenticated users away from app pages
  if (isAppPath && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
