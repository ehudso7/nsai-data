import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const querySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).optional(),
  search: z.string().optional()
})

export async function GET(req: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const userId = session.user.id
    const url = new URL(req.url)
    const searchParams = Object.fromEntries(url.searchParams.entries())
    
    // Validate query parameters
    const result = querySchema.safeParse(searchParams)
    if (!result.success) {
      return new Response(JSON.stringify({ error: 'Invalid query parameters' }), { status: 400 })
    }

    const { page, limit, status, search } = result.data
    const pageNum = parseInt(page)
    const limitNum = Math.min(parseInt(limit), 50) // Max 50 items per page

    // Build where clause
    const where: any = {
      userId,
      // Only include actual research queries, not queue jobs
      result: {
        not: {
          path: ['queueJob'],
          equals: true
        }
      }
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.query = {
        contains: search,
        mode: 'insensitive'
      }
    }

    // Get total count for pagination
    const totalCount = await prisma.researchQuery.count({ where })
    const totalPages = Math.ceil(totalCount / limitNum)

    // Get paginated results
    const history = await prisma.researchQuery.findMany({
      where,
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
      },
      skip: (pageNum - 1) * limitNum,
      take: limitNum
    })

    // Format the response
    const formattedHistory = history.map(item => ({
      id: item.id,
      query: item.query,
      status: item.status,
      credits: item.credits,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      result: item.result
    }))

    return new Response(JSON.stringify({
      history: formattedHistory,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('History API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
}