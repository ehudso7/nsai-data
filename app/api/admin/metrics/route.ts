import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logger } from '@/lib/logging'

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

    // Get usage analytics from the logger
    const analytics = await logger.getUsageAnalytics(timeframe as 'day' | 'week' | 'month')

    return new Response(JSON.stringify(analytics), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Admin metrics API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
}