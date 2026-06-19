import { NextResponse, type NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const cookieHeader = request.headers.get('cookie') || ''
  const hasSession = cookieHeader.includes('sb-ehbosnplrsixaloivtbe-auth-token')

  if (pathname.startsWith('/admin') && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname === '/login' && hasSession) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
}
