import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { jobQueue } from '@/lib/queue'

export async function GET(req: NextRequest) {
  try {
    // Admin authentication check
    const session = await getServerSession(authOptions)
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403 })
    }

    // Get queue statistics
    const queueStats = await jobQueue.getQueueStats()

    return new Response(JSON.stringify(queueStats), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Admin queue stats API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
}