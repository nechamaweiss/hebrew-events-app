import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// המידלוור בודק נוכחות עוגיית התחברות בלבד (Edge runtime).
// האימות המלא של ה-JWT מתבצע בשרת (layout של אזור הניהול ו-API routes).
const PUBLIC_PATHS = ["/login", "/forgot-password"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get("session")?.value);

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!hasSession && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if (hasSession && isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // כל המסלולים למעט קבצים סטטיים ו-API של אימות
  matcher: [
    "/((?!api/auth|api/cron|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|ico|webp)$).*)",
  ],
};
