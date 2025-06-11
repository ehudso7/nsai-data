import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    signOut: '/',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          const { email, password } = loginSchema.parse(credentials)
          
          const user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
              role: true,
              plan: true,
              credits: true,
              apiKey: true,
              image: true,
              createdAt: true,
            }
          })

          if (!user || !user.password) {
            // Log failed attempt without exposing whether user exists
            console.warn(`Login attempt with invalid email: ${email}`)
            return null
          }

          const passwordValid = await bcrypt.compare(password, user.password)
          
          if (!passwordValid) {
            // Log failed password attempt
            console.warn(`Failed login attempt for user: ${user.id}`)
            return null
          }

          // Update last login time
          await prisma.user.update({
            where: { id: user.id },
            data: { 
              updatedAt: new Date(),
            }
          })

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            plan: user.plan,
            credits: user.credits,
            apiKey: user.apiKey || '',
            image: user.image,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.plan = user.plan
        token.credits = user.credits
        token.apiKey = user.apiKey
      }

      if (trigger === 'update' && session) {
        // Update token when session is updated
        return { ...token, ...session }
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.plan = token.plan as string
        session.user.credits = token.credits as number
        session.user.apiKey = token.apiKey as string
      }
      return session
    }
  },
  events: {
    async signIn({ user }) {
      // Log successful sign in
      await prisma.apiUsage.create({
        data: {
          userId: user.id,
          endpoint: '/api/auth/signin',
          method: 'POST',
          statusCode: 200,
          credits: 0,
        }
      })
    }
  },
  debug: process.env.NODE_ENV === 'development',
}