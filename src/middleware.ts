import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Admin routes require ADMIN role
    if (path.startsWith('/admin')) {
      if (token?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // Member routes require MEMBER or higher role
    if (path.startsWith('/dashboard') || path.startsWith('/decode') ||
        path.startsWith('/scan') || path.startsWith('/chat') ||
        path.startsWith('/search') || path.startsWith('/submit') ||
        path.startsWith('/assistance')) {
      const role = token?.role
      if (role !== 'MEMBER' && role !== 'ADMIN') {
        // Free users can access dashboard but see upgrade prompts
        if (role === 'FREE' && path === '/dashboard') {
          return NextResponse.next()
        }
        // Redirect to upgrade page for protected features
        if (role === 'FREE') {
          return NextResponse.redirect(new URL('/upgrade', req.url))
        }
        return NextResponse.redirect(new URL('/login', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname

        // Public routes - no auth required
        if (
          path === '/' ||
          path === '/login' ||
          path === '/signup' ||
          path === '/pricing' ||
          path === '/contact' ||
          path === '/upgrade' ||
          path.startsWith('/brands') ||
          path.startsWith('/api/auth')
        ) {
          return true
        }

        // Protected routes require authentication
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
