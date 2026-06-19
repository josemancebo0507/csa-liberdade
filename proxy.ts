import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const SUPABASE_URL = 'https://ehbosnplrsixaloivtbe.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoYm9zbnBscnNpeGFsb2l2dGJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTEwNjAsImV4cCI6MjA5NzM4NzA2MH0.q-m2sx91Ut5HdjTc8mPoG6a13f5C1kNsKInzD__3YT8'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  if (pathname.startsWith('/admin') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname === '/login' && user) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
}
