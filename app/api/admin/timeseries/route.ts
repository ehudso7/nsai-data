import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns'

export async function GET(req: NextRequest) {
  try {
    // Admin authentication check
    const session = await getServerSession(authOptions)
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403 })
    }

    const url = new URL(req.url)
    const timeframe = url.searchParams.get('timeframe') || 'week'

    if (!['day', 'week', 'month'].includes(timeframe)) {
      return new Response(JSON.stringify({ error: 'Invalid timeframe' }), { status: 400 })
    }

    // Calculate date range
    const intervals = {
      day: 1,
      week: 7,
      month: 30
    }

    const days = intervals[timeframe as keyof typeof intervals]
    const endDate = new Date()
    const startDate = subDays(endDate, days)

    // Generate all dates in the range
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate })

    // Get aggregated data by day
    const dailyStats = await prisma.apiUsage.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: {
        id: true
      },
      _avg: {
        credits: true
      }
    })

    // Get error counts by day
    const errorStats = await prisma.apiUsage.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        statusCode: {
          gte: 400
        }
      },
      _count: {
        id: true
      }
    })

    // Get unique users by day
    const userStats = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(DISTINCT user_id) as unique_users
      FROM "ApiUsage"
      WHERE created_at >= ${startDate} AND created_at <= ${endDate}
      GROUP BY DATE(created_at)
      ORDER BY date
    ` as Array<{ date: Date; unique_users: bigint }>

    // Get average duration from metadata
    const durationStats = await prisma.apiUsage.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        createdAt: true,
        metadata: true
      }
    })

    // Process duration data by day
    const durationByDay = new Map<string, number[]>()
    durationStats.forEach(stat => {
      const date = format(stat.createdAt, 'yyyy-MM-dd')
      const metadata = stat.metadata as any
      if (metadata?.duration) {
        if (!durationByDay.has(date)) {
          durationByDay.set(date, [])
        }
        durationByDay.get(date)!.push(metadata.duration)
      }
    })

    // Create time series data
    const timeSeriesData = dateRange.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd')
      const dayStart = startOfDay(date)
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

      // Find stats for this day
      const requests = dailyStats.filter(stat => 
        stat.createdAt >= dayStart && stat.createdAt < dayEnd
      ).reduce((sum, stat) => sum + stat._count.id, 0)

      const errors = errorStats.filter(stat => 
        stat.createdAt >= dayStart && stat.createdAt < dayEnd
      ).reduce((sum, stat) => sum + stat._count.id, 0)

      const users = userStats.find(stat => 
        format(stat.date, 'yyyy-MM-dd') === dateStr
      )?.unique_users || 0

      // Calculate average duration for this day
      const durations = durationByDay.get(dateStr) || []
      const avgDuration = durations.length > 0 
        ? durations.reduce((a, b) => a + b, 0) / durations.length 
        : 0

      return {
        date: format(date, timeframe === 'day' ? 'HH:mm' : 'MMM dd'),
        requests,
        users: Number(users),
        errors,
        avgDuration: Math.round(avgDuration)
      }
    })

    return new Response(JSON.stringify(timeSeriesData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Admin timeseries API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
}