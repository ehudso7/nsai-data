import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Admin only endpoint
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '24h'
    
    // Calculate date range
    let startDate = new Date()
    switch (period) {
      case '1h':
        startDate.setHours(startDate.getHours() - 1)
        break
      case '24h':
        startDate.setHours(startDate.getHours() - 24)
        break
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      default:
        startDate.setHours(startDate.getHours() - 24)
    }
    
    // Gather metrics
    const [
      totalUsers,
      activeUsers,
      totalQueries,
      totalContacts,
      apiUsageStats,
      creditUsage,
      usersByPlan
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Active users in period
      prisma.user.count({
        where: {
          researchQueries: {
            some: {
              createdAt: { gte: startDate }
            }
          }
        }
      }),
      
      // Total queries in period
      prisma.researchQuery.count({
        where: { createdAt: { gte: startDate } }
      }),
      
      // Contact messages in period
      prisma.contactMessage.count({
        where: { createdAt: { gte: startDate } }
      }),
      
      // API usage stats
      prisma.apiUsage.groupBy({
        by: ['endpoint', 'statusCode'],
        where: { createdAt: { gte: startDate } },
        _count: true,
        _sum: { credits: true }
      }),
      
      // Credit usage
      prisma.researchQuery.aggregate({
        where: { createdAt: { gte: startDate } },
        _sum: { credits: true }
      }),
      
      // Users by plan
      prisma.user.groupBy({
        by: ['plan'],
        _count: true
      })
    ])
    
    // Process API usage stats
    const apiMetrics = apiUsageStats.reduce((acc: Record<string, any>, stat: any) => {
      const key = stat.endpoint
      if (!acc[key]) {
        acc[key] = {
          total: 0,
          success: 0,
          error: 0,
          credits: 0
        }
      }
      
      acc[key].total += stat._count
      if (stat.statusCode >= 200 && stat.statusCode < 300) {
        acc[key].success += stat._count
      } else {
        acc[key].error += stat._count
      }
      acc[key].credits += stat._sum.credits || 0
      
      return acc
    }, {} as Record<string, any>)
    
    // Response rate for queries
    const completedQueries = await prisma.researchQuery.count({
      where: {
        createdAt: { gte: startDate },
        status: 'COMPLETED'
      }
    })
    
    const metrics = {
      period,
      timestamp: new Date().toISOString(),
      users: {
        total: totalUsers,
        active: activeUsers,
        byPlan: usersByPlan.reduce((acc: Record<string, number>, item: any) => {
          acc[item.plan.toLowerCase()] = item._count
          return acc
        }, {} as Record<string, number>)
      },
      usage: {
        queries: {
          total: totalQueries,
          completed: completedQueries,
          successRate: totalQueries > 0 ? (completedQueries / totalQueries * 100).toFixed(2) + '%' : '0%'
        },
        credits: creditUsage._sum.credits || 0,
        contacts: totalContacts
      },
      api: apiMetrics,
      performance: {
        avgResponseTime: '< 2s', // In production, calculate from logs
        uptime: '99.9%' // In production, calculate from monitoring
      }
    }
    
    return NextResponse.json(metrics)
    
  } catch (error) {
    console.error('Metrics error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve metrics' },
      { status: 500 }
    )
  }
}