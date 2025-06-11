import { prisma } from '@/lib/prisma'
import * as Sentry from '@sentry/nextjs'

// Usage log entry interface
interface UsageLogEntry {
  userId: string
  endpoint: string
  method?: string
  query?: string
  outputFormat?: string
  sourceLimit?: number
  ip: string
  userAgent?: string
  timestamp: number
  duration?: number
  statusCode?: number
  tokensUsed?: number
  credits?: number
  error?: string
  metadata?: Record<string, any>
}

// Log levels for different types of events
type LogLevel = 'info' | 'warn' | 'error' | 'debug'

class Logger {
  /**
   * Log API usage to database and optionally to Sentry
   */
  async logUsage(entry: UsageLogEntry): Promise<void> {
    try {
      // Store in database
      await prisma.apiUsage.create({
        data: {
          userId: entry.userId,
          endpoint: entry.endpoint,
          method: entry.method || 'POST',
          statusCode: entry.statusCode || 200,
          credits: entry.credits || 0,
          metadata: {
            query: entry.query,
            outputFormat: entry.outputFormat,
            sourceLimit: entry.sourceLimit,
            ip: entry.ip,
            userAgent: entry.userAgent,
            timestamp: entry.timestamp,
            duration: entry.duration,
            tokensUsed: entry.tokensUsed,
            error: entry.error,
            ...entry.metadata
          },
          createdAt: new Date(entry.timestamp)
        }
      })

      // Log to console for development
      this.consoleLog('info', `API Usage: ${entry.endpoint}`, {
        userId: entry.userId,
        query: entry.query ? (entry.query.substring(0, 100) + (entry.query.length > 100 ? '...' : '')) : undefined,
        duration: entry.duration,
        statusCode: entry.statusCode
      })

      // Send to Sentry for monitoring (only errors and warnings)
      if (entry.error || (entry.statusCode && entry.statusCode >= 400)) {
        Sentry.addBreadcrumb({
          message: `API ${entry.endpoint} - Status ${entry.statusCode}`,
          category: 'api.usage',
          level: (entry.statusCode && entry.statusCode >= 500) ? 'error' : 'warning',
          data: {
            userId: entry.userId,
            endpoint: entry.endpoint,
            statusCode: entry.statusCode,
            duration: entry.duration,
            error: entry.error
          }
        })

        if (entry.error) {
          Sentry.captureException(new Error(entry.error), {
            tags: {
              component: 'api',
              endpoint: entry.endpoint,
              userId: entry.userId
            },
            extra: {
              query: entry.query,
              duration: entry.duration,
              ip: entry.ip
            }
          })
        }
      }
    } catch (error) {
      console.error('Failed to log usage:', error)
      // Don't throw - logging failures shouldn't break the API
    }
  }

  /**
   * Log security events
   */
  async logSecurity(event: {
    type: 'rate_limit' | 'invalid_input' | 'unauthorized' | 'abuse_detected' | 'malicious_content'
    userId?: string
    ip: string
    endpoint: string
    details: string
    metadata?: Record<string, any>
  }): Promise<void> {
    try {
      // Log security event to API usage table with security flag
      await prisma.apiUsage.create({
        data: {
          userId: event.userId || 'unknown',
          endpoint: event.endpoint,
          method: 'SECURITY',
          statusCode: 403,
          credits: 0,
          metadata: {
            securityEvent: event.type,
            ip: event.ip,
            details: event.details,
            ...event.metadata
          }
        }
      })

      // Log security events to console
      this.consoleLog('warn', `Security Event: ${event.type}`, {
        ip: event.ip,
        endpoint: event.endpoint,
        details: event.details,
        userId: event.userId
      })

      // Always send security events to Sentry
      Sentry.captureMessage(`Security Event: ${event.type}`, {
        level: 'warning',
        tags: {
          component: 'security',
          eventType: event.type,
          endpoint: event.endpoint
        },
        extra: {
          ip: event.ip,
          userId: event.userId,
          details: event.details,
          metadata: event.metadata
        }
      })
    } catch (error) {
      console.error('Failed to log security event:', error)
    }
  }

  /**
   * Log performance metrics
   */
  async logPerformance(metrics: {
    endpoint: string
    userId?: string
    duration: number
    tokensUsed?: number
    memoryUsage?: number
    cpuUsage?: number
    metadata?: Record<string, any>
  }): Promise<void> {
    try {
      // Log performance data
      this.consoleLog('debug', `Performance: ${metrics.endpoint}`, {
        duration: metrics.duration,
        tokensUsed: metrics.tokensUsed,
        memoryUsage: metrics.memoryUsage
      })

      // Send performance data to Sentry
      Sentry.addBreadcrumb({
        message: `Performance metrics for ${metrics.endpoint}`,
        category: 'performance',
        level: 'info',
        data: metrics
      })

      // Alert on slow requests
      if (metrics.duration > 30000) { // 30 seconds
        Sentry.captureMessage(`Slow API response: ${metrics.endpoint}`, {
          level: 'warning',
          tags: {
            component: 'performance',
            endpoint: metrics.endpoint
          },
          extra: metrics
        })
      }
    } catch (error) {
      console.error('Failed to log performance:', error)
    }
  }

  /**
   * Get usage analytics
   */
  async getUsageAnalytics(timeframe: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<{
    totalRequests: number
    totalUsers: number
    avgDuration: number
    totalCredits: number
    errorRate: number
    topEndpoints: Array<{ endpoint: string; count: number }>
    topUsers: Array<{ userId: string; count: number }>
  }> {
    try {
      const intervals = {
        hour: 60 * 60 * 1000,
        day: 24 * 60 * 60 * 1000,
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000
      }

      const since = new Date(Date.now() - intervals[timeframe])

      const [analytics, topEndpoints, topUsers] = await Promise.all([
        prisma.apiUsage.aggregate({
          where: { createdAt: { gte: since } },
          _count: { id: true },
          _avg: { credits: true },
          _sum: { credits: true }
        }),
        prisma.apiUsage.groupBy({
          by: ['endpoint'],
          where: { createdAt: { gte: since } },
          _count: { endpoint: true },
          orderBy: { _count: { endpoint: 'desc' } },
          take: 10
        }),
        prisma.apiUsage.groupBy({
          by: ['userId'],
          where: { createdAt: { gte: since } },
          _count: { userId: true },
          orderBy: { _count: { userId: 'desc' } },
          take: 10
        })
      ])

      const uniqueUsers = await prisma.apiUsage.findMany({
        where: { createdAt: { gte: since } },
        select: { userId: true },
        distinct: ['userId']
      })

      const errorCount = await prisma.apiUsage.count({
        where: {
          createdAt: { gte: since },
          statusCode: { gte: 400 }
        }
      })

      const totalRequests = analytics._count.id
      const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0

      // Calculate average duration from metadata
      const durationsData = await prisma.apiUsage.findMany({
        where: {
          createdAt: { gte: since }
        },
        select: { metadata: true }
      })

      const durations = durationsData
        .map(d => d.metadata as any)
        .filter(m => m.duration)
        .map(m => m.duration as number)

      const avgDuration = durations.length > 0 
        ? durations.reduce((a, b) => a + b, 0) / durations.length 
        : 0

      return {
        totalRequests,
        totalUsers: uniqueUsers.length,
        avgDuration,
        totalCredits: analytics._sum.credits || 0,
        errorRate,
        topEndpoints: topEndpoints.map(e => ({
          endpoint: e.endpoint,
          count: e._count.endpoint
        })),
        topUsers: topUsers.map(u => ({
          userId: u.userId,
          count: u._count.userId
        }))
      }
    } catch (error) {
      console.error('Failed to get usage analytics:', error)
      return {
        totalRequests: 0,
        totalUsers: 0,
        avgDuration: 0,
        totalCredits: 0,
        errorRate: 0,
        topEndpoints: [],
        topUsers: []
      }
    }
  }

  /**
   * Console logging with structured format
   */
  private consoleLog(level: LogLevel, message: string, data?: any): void {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...data
    }

    switch (level) {
      case 'error':
        console.error('🚨', JSON.stringify(logEntry))
        break
      case 'warn':
        console.warn('⚠️', JSON.stringify(logEntry))
        break
      case 'debug':
        if (process.env.NODE_ENV === 'development') {
          console.debug('🔍', JSON.stringify(logEntry))
        }
        break
      default:
        console.log('ℹ️', JSON.stringify(logEntry))
    }
  }

  /**
   * Export logs for analysis
   */
  async exportLogs(
    startDate: Date,
    endDate: Date,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    try {
      const logs = await prisma.apiUsage.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      if (format === 'csv') {
        const headers = 'timestamp,userId,endpoint,method,statusCode,credits,duration,ip\n'
        const rows = logs.map(log => {
          const metadata = log.metadata as any
          return [
            log.createdAt.toISOString(),
            log.userId,
            log.endpoint,
            log.method,
            log.statusCode,
            log.credits,
            metadata?.duration || '',
            metadata?.ip || ''
          ].join(',')
        }).join('\n')
        
        return headers + rows
      }

      return JSON.stringify(logs, null, 2)
    } catch (error) {
      console.error('Failed to export logs:', error)
      return JSON.stringify({ error: 'Failed to export logs' })
    }
  }
}

// Export singleton instance
export const logUsage = (entry: UsageLogEntry) => logger.logUsage(entry)
export const logSecurity = (event: Parameters<Logger['logSecurity']>[0]) => logger.logSecurity(event)
export const logPerformance = (metrics: Parameters<Logger['logPerformance']>[0]) => logger.logPerformance(metrics)

// Export the logger instance
const logger = new Logger()
export { logger }