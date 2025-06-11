import { prisma } from '@/lib/prisma'
import { cache, cacheKeys, cacheConfigs } from '@/lib/cache'

// Rate limit configurations by plan
const RATE_LIMITS = {
  FREE: { requests: 10, window: 60 * 60 * 1000 }, // 10 requests per hour
  STARTER: { requests: 50, window: 60 * 60 * 1000 }, // 50 requests per hour
  PROFESSIONAL: { requests: 200, window: 60 * 60 * 1000 }, // 200 requests per hour
  ENTERPRISE: { requests: 1000, window: 60 * 60 * 1000 }, // 1000 requests per hour
} as const

// Tag-specific rate limits
const TAG_LIMITS = {
  ai_research: { FREE: 5, STARTER: 25, PROFESSIONAL: 100, ENTERPRISE: 500 },
  api_general: { FREE: 10, STARTER: 50, PROFESSIONAL: 200, ENTERPRISE: 1000 },
  contact_form: { FREE: 3, STARTER: 10, PROFESSIONAL: 50, ENTERPRISE: 100 },
} as const

interface RateLimitResult {
  allowed: boolean
  remaining: number
  reset: Date
  limit: number
}

class RateLimit {
  /**
   * Check if a request is allowed based on user plan, IP, and tag
   */
  async check(userId: string, ip: string, tag: keyof typeof TAG_LIMITS): Promise<RateLimitResult> {
    try {
      // Elite: Cache-first user plan lookup
      const user = await cache.getOrSet(
        cacheKeys.userPlan(userId),
        async () => prisma.user.findUnique({
          where: { id: userId },
          select: { plan: true }
        }),
        cacheConfigs.userPlan
      )

      const userPlan = (user?.plan as keyof typeof RATE_LIMITS) || 'FREE'
      const tagLimits = TAG_LIMITS[tag]
      const limit = tagLimits[userPlan]
      const window = RATE_LIMITS[userPlan].window

      const now = new Date()
      const windowStart = new Date(now.getTime() - window)

      // Clean up old rate limit records
      await this.cleanup(windowStart)

      // Create composite key for user + IP + tag combination
      const identifier = `${userId}:${ip}:${tag}`

      // Elite: Use cached rate limit counter
      const cacheKey = `${cacheKeys.rateLimit(identifier)}:${Math.floor(now.getTime() / window)}`
      let recentRequests = await cache.get<number>(cacheKey) || 0
      
      // If not in cache, get from database
      if (recentRequests === 0) {
        recentRequests = await prisma.rateLimit.count({
          where: {
            identifier,
            windowStart: {
              gte: windowStart
            }
          }
        })
        // Cache the count
        await cache.set(cacheKey, recentRequests, { ttl: window })
      }

      const remaining = Math.max(0, limit - recentRequests)
      const allowed = recentRequests < limit

      if (allowed) {
        // Elite: Async non-blocking rate limit recording
        Promise.all([
          // Record in database (non-blocking)
          prisma.rateLimit.create({
            data: {
              identifier,
              endpoint: tag,
              windowStart: now
            }
          }).catch(err => console.error('Rate limit record error:', err)),
          // Increment cache counter
          cache.set(cacheKey, recentRequests + 1, { ttl: window })
        ])
      }

      return {
        allowed,
        remaining: allowed ? remaining - 1 : remaining,
        reset: new Date(now.getTime() + window),
        limit
      }
    } catch (error) {
      console.error('Rate limit check error:', error)
      // Fail open in case of database issues
      return {
        allowed: true,
        remaining: 999,
        reset: new Date(Date.now() + 60 * 60 * 1000),
        limit: 1000
      }
    }
  }

  /**
   * Get current rate limit status without incrementing
   */
  async status(userId: string, ip: string, tag: keyof typeof TAG_LIMITS): Promise<RateLimitResult> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true }
      })

      const userPlan = (user?.plan as keyof typeof RATE_LIMITS) || 'FREE'
      const tagLimits = TAG_LIMITS[tag]
      const limit = tagLimits[userPlan]
      const window = RATE_LIMITS[userPlan].window

      const now = new Date()
      const windowStart = new Date(now.getTime() - window)
      const identifier = `${userId}:${ip}:${tag}`

      const recentRequests = await prisma.rateLimit.count({
        where: {
          identifier,
          windowStart: {
            gte: windowStart
          }
        }
      })

      const remaining = Math.max(0, limit - recentRequests)

      return {
        allowed: recentRequests < limit,
        remaining,
        reset: new Date(now.getTime() + window),
        limit
      }
    } catch (error) {
      console.error('Rate limit status error:', error)
      return {
        allowed: true,
        remaining: 999,
        reset: new Date(Date.now() + 60 * 60 * 1000),
        limit: 1000
      }
    }
  }

  /**
   * Reset rate limit for a specific user/IP/tag combination
   */
  async reset(userId: string, ip: string, tag: keyof typeof TAG_LIMITS): Promise<void> {
    try {
      const identifier = `${userId}:${ip}:${tag}`
      await prisma.rateLimit.deleteMany({
        where: { identifier }
      })
    } catch (error) {
      console.error('Rate limit reset error:', error)
    }
  }

  /**
   * Clean up old rate limit records
   */
  private async cleanup(olderThan: Date): Promise<void> {
    try {
      // Only run cleanup 1% of the time to avoid database overhead
      if (Math.random() > 0.01) return

      await prisma.rateLimit.deleteMany({
        where: {
          windowStart: {
            lt: olderThan
          }
        }
      })
    } catch (error) {
      console.error('Rate limit cleanup error:', error)
    }
  }

  /**
   * Get rate limit statistics for monitoring
   */
  async getStats(timeframe: 'hour' | 'day' | 'week' = 'hour'): Promise<{
    totalRequests: number
    uniqueUsers: number
    topTags: Array<{ tag: string; count: number }>
    topUsers: Array<{ userId: string; count: number }>
  }> {
    try {
      const intervals = {
        hour: 60 * 60 * 1000,
        day: 24 * 60 * 60 * 1000,
        week: 7 * 24 * 60 * 60 * 1000
      }

      const since = new Date(Date.now() - intervals[timeframe])

      const [totalRequests, topEndpoints] = await Promise.all([
        prisma.rateLimit.count({
          where: { windowStart: { gte: since } }
        }),
        prisma.rateLimit.groupBy({
          by: ['endpoint'],
          where: { windowStart: { gte: since } },
          _count: { endpoint: true },
          orderBy: { _count: { endpoint: 'desc' } },
          take: 10
        }).then(groups => groups.map(g => ({ tag: g.endpoint, count: g._count.endpoint })))
      ])

      // Get unique identifiers for user count approximation
      const uniqueIdentifiers = await prisma.rateLimit.findMany({
        where: { windowStart: { gte: since } },
        select: { identifier: true },
        distinct: ['identifier']
      })

      const uniqueUsers = uniqueIdentifiers.length

      return {
        totalRequests,
        uniqueUsers,
        topTags: topEndpoints,
        topUsers: [] // Not available with current schema
      }
    } catch (error) {
      console.error('Rate limit stats error:', error)
      return {
        totalRequests: 0,
        uniqueUsers: 0,
        topTags: [],
        topUsers: []
      }
    }
  }
}

// Export singleton instance
export const ratelimit = new RateLimit()

// Export the class for testing
export { RateLimit }