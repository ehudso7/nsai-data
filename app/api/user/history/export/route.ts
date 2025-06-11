import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'

export async function GET(req: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const userId = session.user.id
    const url = new URL(req.url)
    const exportFormat = url.searchParams.get('format') || 'json'

    if (!['json', 'csv'].includes(exportFormat)) {
      return new Response(JSON.stringify({ error: 'Invalid format. Use json or csv' }), { status: 400 })
    }

    // Get all research history for the user
    const history = await prisma.researchQuery.findMany({
      where: {
        userId,
        // Only include actual research queries, not queue jobs
        result: {
          not: {
            path: ['queueJob'],
            equals: true
          }
        }
      },
      select: {
        id: true,
        query: true,
        status: true,
        credits: true,
        createdAt: true,
        updatedAt: true,
        result: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (exportFormat === 'csv') {
      // Generate CSV
      const headers = 'ID,Query,Status,Credits,Created At,Updated At,Has Result\n'
      const rows = history.map(item => {
        const query = item.query.replace(/"/g, '""') // Escape quotes
        const hasResult = item.result ? 'Yes' : 'No'
        
        return [
          item.id,
          `"${query}"`,
          item.status,
          item.credits,
          format(item.createdAt, 'yyyy-MM-dd HH:mm:ss'),
          format(item.updatedAt, 'yyyy-MM-dd HH:mm:ss'),
          hasResult
        ].join(',')
      }).join('\n')

      const csvContent = headers + rows

      return new Response(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="research-history-${format(new Date(), 'yyyy-MM-dd')}.csv"`
        }
      })
    } else {
      // Generate JSON
      const jsonData = {
        exportedAt: new Date().toISOString(),
        userId,
        totalCount: history.length,
        data: history.map(item => ({
          id: item.id,
          query: item.query,
          status: item.status,
          credits: item.credits,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
          hasResult: !!item.result,
          result: item.result
        }))
      }

      return new Response(JSON.stringify(jsonData, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="research-history-${format(new Date(), 'yyyy-MM-dd')}.json"`
        }
      })
    }

  } catch (error) {
    console.error('Export history error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
}