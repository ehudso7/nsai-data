import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logger } from '@/lib/logging'
import { format } from 'date-fns'

export async function GET(req: NextRequest) {
  try {
    // Admin authentication check
    const session = await getServerSession(authOptions)
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403 })
    }

    const url = new URL(req.url)
    const exportFormat = url.searchParams.get('format') || 'json'
    const timeframe = url.searchParams.get('timeframe') || 'week'

    if (!['json', 'csv'].includes(exportFormat)) {
      return new Response(JSON.stringify({ error: 'Invalid format. Use json or csv' }), { status: 400 })
    }

    if (!['day', 'week', 'month'].includes(timeframe)) {
      return new Response(JSON.stringify({ error: 'Invalid timeframe' }), { status: 400 })
    }

    // Calculate date range for export
    const intervals = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    }

    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - intervals[timeframe as keyof typeof intervals])

    // Get detailed logs for export
    const exportData = await logger.exportLogs(startDate, endDate, exportFormat as 'json' | 'csv')

    // Get additional analytics for summary
    const analytics = await logger.getUsageAnalytics(timeframe as 'day' | 'week' | 'month')

    if (exportFormat === 'csv') {
      // Add summary header to CSV
      const summaryHeader = `# NSAI Data Usage Analytics Export\n# Timeframe: ${timeframe}\n# Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}\n# Total Requests: ${analytics.totalRequests}\n# Total Users: ${analytics.totalUsers}\n# Error Rate: ${analytics.errorRate.toFixed(2)}%\n\n`
      
      return new Response(summaryHeader + exportData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="nsai-usage-analytics-${timeframe}-${format(new Date(), 'yyyy-MM-dd')}.csv"`
        }
      })
    } else {
      // Create comprehensive JSON export
      const jsonExport = {
        metadata: {
          exportedAt: new Date().toISOString(),
          timeframe,
          dateRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString()
          }
        },
        summary: analytics,
        detailedLogs: JSON.parse(exportData)
      }

      return new Response(JSON.stringify(jsonExport, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="nsai-usage-analytics-${timeframe}-${format(new Date(), 'yyyy-MM-dd')}.json"`
        }
      })
    }

  } catch (error) {
    console.error('Admin export API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
}