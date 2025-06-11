import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Paths that require authentication
const protectedPaths = [
  '/dashboard',
  '/api/research',
  '/api/user',
]

// API paths that don't require authentication
const publicApiPaths = [
  '/api/auth',
  '/api/contact',
  '/api/health',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Add security headers
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://vitals.vercel-insights.com https://www.google-analytics.com;"
  )
  
  // CORS for API routes
  if (pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin')
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
    
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')
      response.headers.set('Access-Control-Max-Age', '86400')
    }
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: response.headers })
    }
  }
  
  // Check if path requires authentication
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
  const isPublicApiPath = publicApiPaths.some(path => pathname.startsWith(path))
  
  if (isProtectedPath && !isPublicApiPath) {
    const token = await getToken({ req: request })
    
    if (!token) {
      // Redirect to login if accessing protected page
      if (!pathname.startsWith('/api/')) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(url)
      }
      
      // Return 401 for protected API routes
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401, headers: response.headers }
      )
    }
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}