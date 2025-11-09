import { NextResponse, type NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  const isAuthPage = pathname === "/login" || pathname === "/register"
  const protectedPrefixes = ["/dashboard", "/profile", "/submissions", "/analytics", "/map", "/admin"]
  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p))

  let hasAuth = false
  try {
    const names = req.cookies.getAll().map((c) => c.name)
    hasAuth = names.some((n) => /^sb-[^-]+-auth-token(\.1)?$/.test(n))
  } catch {}

  if (!hasAuth && isProtected) {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  if (hasAuth && isAuthPage) {
    const url = req.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/dashboard/:path*",
    "/profile/:path*",
    "/submissions/:path*",
    "/analytics",
    "/map",
    "/admin/:path*",
  ],
}
