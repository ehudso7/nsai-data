import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { enqueueRetryJob } from '@/lib/queue'
import { z } from 'zod'

const retrySchema = z.object({
  queryId: z.string().min(1)
})

export async function POST(req: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const userId = session.user.id
    const body = await req.json()
    
    // Validate request body
    const result = retrySchema.safeParse(body)
    if (!result.success) {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 })
    }

    const { queryId } = result.data

    // Get the original research query
    const originalQuery = await prisma.researchQuery.findFirst({
      where: {
        id: queryId,
        userId // Ensure user owns this query
      }
    })

    if (!originalQuery) {
      return new Response(JSON.stringify({ error: 'Research query not found' }), { status: 404 })
    }

    // Check if query is in a retryable state
    if (originalQuery.status !== 'FAILED') {
      return new Response(JSON.stringify({ error: 'Only failed queries can be retried' }), { status: 400 })
    }

    // Check user credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true, plan: true }
    })

    if (!user || user.credits < 1) {
      return new Response(JSON.stringify({ error: 'Insufficient credits for retry' }), { status: 402 })
    }

    // Extract parameters from original query result metadata
    const result_data = originalQuery.result as any
    const outputFormat = result_data?.outputFormat || 'text'
    const sourceLimit = result_data?.sourceLimit || 5
    const focusArea = result_data?.focusArea || 'general'

    // Enqueue retry job
    const jobId = await enqueueRetryJob({
      userId,
      query: originalQuery.query,
      outputFormat,
      sourceLimit,
      focusArea,
      priority: 'high', // Retries get higher priority
      metadata: {
        originalQueryId: originalQuery.id,
        retryAttempt: true,
        retryTimestamp: new Date().toISOString()
      }
    })

    // Update original query status to indicate retry is queued
    await prisma.researchQuery.update({
      where: { id: queryId },
      data: {
        status: 'PENDING',
        result: {
          ...result_data,
          retryJobId: jobId,
          retryQueuedAt: new Date().toISOString()
        }
      }
    })

    return new Response(JSON.stringify({
      success: true,
      message: 'Query retry queued successfully',
      jobId,
      estimatedProcessingTime: '2-5 minutes'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Retry API error:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to queue retry job',
      details: (error as Error).message 
    }), { status: 500 })
  }
}