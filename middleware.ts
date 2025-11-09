import { NextResponse, type NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  const isAuthPage = pathname === "/login" || pathname === "/register"
  const protectedPrefixes = ["/dashboard", "/profile", "/submissions", "/analytics", "/map", "/admin"]
  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p))

  let hasSession = false
  try {
    const cookies = req.cookies.getAll()
    hasSession = cookies.some(cookie => 
      cookie.name.startsWith('sb-') && cookie.name.includes('auth-token')
    )
  } catch (e) {
    hasSession = false
  }

  if (!hasSession && isProtected) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (hasSession && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
