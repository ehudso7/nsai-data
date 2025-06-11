import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/login')
  }
  
  // Fetch user data and usage stats
  const [user, recentQueries, usage] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        credits: true,
        apiKey: true,
        _count: {
          select: {
            researchQueries: true
          }
        }
      }
    }),
    prisma.researchQuery.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        query: true,
        status: true,
        createdAt: true,
        credits: true,
      }
    }),
    prisma.apiUsage.aggregate({
      where: { 
        userId: session.user.id,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      _avg: {
        credits: true
      },
      _count: true
    })
  ])
  
  if (!user) {
    redirect('/login')
  }
  
  const planLimits = {
    FREE: { queries: 10, rateLimit: '10/hour' },
    STARTER: { queries: 100, rateLimit: '50/hour' },
    PROFESSIONAL: { queries: 1000, rateLimit: '200/hour' },
    ENTERPRISE: { queries: -1, rateLimit: 'Unlimited' }
  }
  
  const limit = planLimits[user.plan as keyof typeof planLimits]
  
  const dashboardData = {
    user: {
      name: user.name || 'User',
      email: user.email,
      plan: user.plan,
      credits: user.credits,
      apiKey: user.apiKey
    },
    usage: {
      queries_used: user._count.researchQueries,
      queries_limit: limit.queries,
      credits_remaining: user.credits,
      avg_response_time: 2.3, // In production, calculate from logs
      total_reports: user._count.researchQueries
    },
    recentQueries,
    rateLimit: limit.rateLimit
  }
  
  return <DashboardClient data={dashboardData} />
}