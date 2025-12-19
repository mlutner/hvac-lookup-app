import { PrismaAdapter } from '@auth/prisma-adapter'
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

// Define types as string literals for SQLite compatibility
export type UserRole = 'PUBLIC' | 'FREE' | 'MEMBER' | 'ADMIN'
export type MembershipTier = 'FREE' | 'GOLD' | 'PLATINUM' | 'TEAM' | 'ENTERPRISE'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: UserRole
      tier: MembershipTier
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role: UserRole
    tier: MembershipTier
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    tier: MembershipTier
  }
}

export const authOptions: NextAuthOptions = {
  // Note: Don't use adapter with CredentialsProvider + JWT strategy
  // adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  session: {
    strategy: 'jwt',
  },
  debug: process.env.NODE_ENV === 'development',
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/login',
    newUser: '/dashboard',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.passwordHash) {
          throw new Error('Invalid email or password')
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash)

        if (!isValid) {
          throw new Error('Invalid email or password')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
          tier: user.tier as MembershipTier,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.tier = user.tier
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.tier = token.tier
      }
      return session
    },
  },
}

// Access control helpers
export function canAccess(role: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    PUBLIC: 0,
    FREE: 1,
    MEMBER: 2,
    ADMIN: 3,
  }
  return roleHierarchy[role] >= roleHierarchy[requiredRole]
}

export function isMember(role: UserRole): boolean {
  return canAccess(role, 'MEMBER')
}

export function isAdmin(role: UserRole): boolean {
  return role === 'ADMIN'
}

export function tierLevel(tier: MembershipTier): number {
  const tierHierarchy: Record<MembershipTier, number> = {
    FREE: 0,
    GOLD: 1,
    PLATINUM: 2,
    TEAM: 3,
    ENTERPRISE: 4,
  }
  return tierHierarchy[tier]
}
