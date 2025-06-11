import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'
import Redis from 'redis'
import * as Sentry from '@sentry/nextjs'
import { logUsage } from '@/lib/logging'

// Elite Queue Configuration with optimized settings
const QUEUE_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  deadLetterAfter: 24 * 60 * 60 * 1000, // 24 hours
  batchSize: 10, // Process multiple jobs concurrently
  pollingInterval: 100, // More responsive polling
  workerPoolSize: 4, // Concurrent workers
  enablePriorityQueue: true,
  compressionEnabled: true
}

// Job status enum
type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'dead_letter'

// Job interface
interface QueueJob {
  id: string
  userId: string
  query: string
  outputFormat: 'text' | 'json'
  sourceLimit: number
  focusArea?: string
  status: JobStatus
  attempts: number
  maxRetries: number
  nextRetry?: Date
  createdAt: Date
  updatedAt: Date
  error?: string
  result?: any
  metadata?: Record<string, any>
}

// Initialize Redis client (fallback to memory if Redis unavailable)
let redisClient: any = null
try {
  if (process.env.REDIS_URL) {
    redisClient = Redis.createClient({
      url: process.env.REDIS_URL
    })
    redisClient.on('error', (err: Error) => {
      console.warn('Redis client error, falling back to database queue:', err.message)
      redisClient = null
    })
  }
} catch (error) {
  console.warn('Redis initialization failed, using database queue:', error)
}

// Initialize Supabase client (optional)
let supabase: any = null
try {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  }
} catch (error) {
  console.warn('Supabase initialization failed, using database queue:', error)
}

class JobQueue {
  /**
   * Enqueue a retry job for failed AI requests
   */
  async enqueueRetryJob({
    userId,
    query,
    outputFormat = 'text',
    sourceLimit = 5,
    focusArea = 'general',
    priority = 'normal',
    metadata = {}
  }: {
    userId: string
    query: string
    outputFormat?: 'text' | 'json'
    sourceLimit?: number
    focusArea?: string
    priority?: 'high' | 'normal' | 'low'
    metadata?: Record<string, any>
  }): Promise<string> {
    try {
      const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const now = new Date()

      const job: Partial<QueueJob> = {
        id: jobId,
        userId,
        query: query.substring(0, 1000), // Truncate long queries
        outputFormat,
        sourceLimit,
        focusArea,
        status: 'pending',
        attempts: 0,
        maxRetries: QUEUE_CONFIG.maxRetries,
        createdAt: now,
        updatedAt: now,
        metadata: {
          priority,
          originalTimestamp: now.toISOString(),
          ...metadata
        }
      }

      // Try Redis first for high-performance queue
      if (redisClient && await this.isRedisHealthy()) {
        await redisClient.hSet(`queue:job:${jobId}`, job)
        await redisClient.lPush('queue:pending', jobId)
        
        // Set TTL for cleanup
        await redisClient.expire(`queue:job:${jobId}`, 7 * 24 * 60 * 60) // 7 days
      } 
      // Fallback to Supabase if available
      else if (supabase) {
        const { error } = await supabase
          .from('queue_jobs')
          .insert([{
            id: jobId,
            user_id: userId,
            query,
            output_format: outputFormat,
            source_limit: sourceLimit,
            focus_area: focusArea,
            status: 'pending',
            attempts: 0,
            max_retries: QUEUE_CONFIG.maxRetries,
            metadata: job.metadata,
            created_at: now.toISOString(),
            updated_at: now.toISOString()
          }])

        if (error) {
          throw new Error(`Supabase queue error: ${error.message}`)
        }
      }
      // Final fallback to Prisma database
      else {
        await prisma.researchQuery.create({
          data: {
            id: jobId,
            userId,
            query,
            status: 'PENDING',
            result: {
              queueJob: true,
              outputFormat,
              sourceLimit,
              focusArea,
              attempts: 0,
              maxRetries: QUEUE_CONFIG.maxRetries,
              metadata: job.metadata
            }
          }
        })
      }

      // Log job creation
      await logUsage({
        userId,
        endpoint: '/queue/enqueue',
        method: 'POST',
        query: `Job queued: ${query.substring(0, 100)}...`,
        ip: 'internal',
        timestamp: Date.now(),
        statusCode: 200,
        credits: 0,
        metadata: { jobId, priority }
      })

      console.log(`✅ Job ${jobId} enqueued successfully`)
      return jobId

    } catch (error) {
      console.error('Failed to enqueue retry job:', error)
      
      // Report to Sentry
      Sentry.captureException(error, {
        tags: { component: 'queue', operation: 'enqueue' },
        extra: { userId, query: query.substring(0, 100) }
      })

      throw new Error(`Failed to enqueue job: ${(error as Error).message}`)
    }
  }

  /**
   * Elite concurrent job processing with batching and priority support
   */
  async processQueue(): Promise<void> {
    try {
      let jobs: string[] = []

      // Get batch of pending jobs with priority support
      if (redisClient && await this.isRedisHealthy()) {
        // Use Redis pipeline for atomic batch operations
        const pipeline = redisClient.multi()
        
        // Get high priority jobs first
        for (let i = 0; i < QUEUE_CONFIG.batchSize; i++) {
          pipeline.lPop('queue:high-priority')
        }
        
        // Then normal priority
        for (let i = 0; i < QUEUE_CONFIG.batchSize; i++) {
          pipeline.lPop('queue:pending')
        }
        
        const results = await pipeline.exec()
        jobs = results
          .filter((r: any) => r && r[1])
          .map((r: any) => r[1] as string)
      }
      // Get from Supabase
      else if (supabase) {
        const { data, error } = await supabase
          .from('queue_jobs')
          .select('id')
          .eq('status', 'pending')
          .or('next_retry.is.null,next_retry.lte.now()')
          .order('created_at', { ascending: true })
          .limit(5)

        if (!error && data) {
          jobs = data.map((job: any) => job.id)
        }
      }
      // Get from Prisma
      else {
        const pendingJobs = await prisma.researchQuery.findMany({
          where: {
            status: 'PENDING',
            result: {
              path: ['queueJob'],
              equals: true
            }
          },
          orderBy: { createdAt: 'asc' },
          take: 5
        })
        jobs = pendingJobs.map(job => job.id)
      }

      // Process jobs concurrently with worker pool
      if (jobs.length > 0) {
        const workerPromises = jobs.slice(0, QUEUE_CONFIG.workerPoolSize).map(
          jobId => this.processJobWithTimeout(jobId, 120000) // 2 min timeout
        )
        
        await Promise.allSettled(workerPromises)
      }

    } catch (error) {
      console.error('Queue processing error:', error)
      Sentry.captureException(error, {
        tags: { component: 'queue', operation: 'process' }
      })
    }
  }

  /**
   * Process job with timeout and error boundary
   */
  private async processJobWithTimeout(jobId: string, timeout: number): Promise<void> {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Job timeout')), timeout)
    )
    
    try {
      await Promise.race([this.processJob(jobId), timeoutPromise])
    } catch (error) {
      console.error(`Job ${jobId} failed with timeout:`, error)
      await this.handleJobFailure(jobId, error as Error)
    }
  }

  /**
   * Process a single job with retry logic
   */
  private async processJob(jobId: string): Promise<void> {
    let job: QueueJob | null = null

    try {
      // Get job details
      if (redisClient && await this.isRedisHealthy()) {
        const jobData = await redisClient.hGetAll(`queue:job:${jobId}`)
        if (jobData && Object.keys(jobData).length > 0) {
          job = {
            ...jobData,
            attempts: parseInt(jobData.attempts) || 0,
            maxRetries: parseInt(jobData.maxRetries) || QUEUE_CONFIG.maxRetries,
            metadata: JSON.parse(jobData.metadata || '{}'),
            createdAt: new Date(jobData.createdAt),
            updatedAt: new Date(jobData.updatedAt)
          } as QueueJob
        }
      } else if (supabase) {
        const { data, error } = await supabase
          .from('queue_jobs')
          .select('*')
          .eq('id', jobId)
          .single()

        if (!error && data) {
          job = {
            id: data.id,
            userId: data.user_id,
            query: data.query,
            outputFormat: data.output_format,
            sourceLimit: data.source_limit,
            focusArea: data.focus_area,
            status: data.status,
            attempts: data.attempts,
            maxRetries: data.max_retries,
            nextRetry: data.next_retry ? new Date(data.next_retry) : undefined,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
            error: data.error,
            result: data.result,
            metadata: data.metadata
          }
        }
      } else {
        const prismaJob = await prisma.researchQuery.findUnique({
          where: { id: jobId }
        })
        
        if (prismaJob && prismaJob.result) {
          const resultData = prismaJob.result as any
          job = {
            id: prismaJob.id,
            userId: prismaJob.userId,
            query: prismaJob.query,
            outputFormat: resultData.outputFormat || 'text',
            sourceLimit: resultData.sourceLimit || 5,
            focusArea: resultData.focusArea,
            status: prismaJob.status.toLowerCase() as JobStatus,
            attempts: resultData.attempts || 0,
            maxRetries: resultData.maxRetries || QUEUE_CONFIG.maxRetries,
            createdAt: prismaJob.createdAt,
            updatedAt: prismaJob.updatedAt,
            error: resultData.error,
            result: resultData.result,
            metadata: resultData.metadata
          }
        }
      }

      if (!job) {
        console.warn(`Job ${jobId} not found`)
        return
      }

      // Check if job should be moved to dead letter
      if (job.attempts >= job.maxRetries) {
        await this.moveToDeadLetter(job)
        return
      }

      // Mark as processing
      await this.updateJobStatus(jobId, 'processing', { attempts: job.attempts + 1 })

      // Execute the AI research request
      const result = await this.executeResearchJob(job)

      // Mark as completed
      await this.updateJobStatus(jobId, 'completed', { result })

      console.log(`✅ Job ${jobId} completed successfully`)

    } catch (error) {
      const errorMessage = (error as Error).message

      if (job) {
        // Calculate next retry time with exponential backoff
        const delay = Math.min(
          QUEUE_CONFIG.baseDelay * Math.pow(QUEUE_CONFIG.backoffMultiplier, job.attempts),
          QUEUE_CONFIG.maxDelay
        )
        const nextRetry = new Date(Date.now() + delay)

        // Update job with error and retry info
        await this.updateJobStatus(jobId, 'failed', {
          error: errorMessage,
          nextRetry: job.attempts < job.maxRetries ? nextRetry : undefined
        })

        // Re-queue for retry if not exceeding max retries
        if (job.attempts < job.maxRetries) {
          setTimeout(() => {
            this.requeueJob(jobId)
          }, delay)
          
          console.log(`🔄 Job ${jobId} scheduled for retry ${job.attempts + 1}/${job.maxRetries} in ${delay}ms`)
        }
      }

      console.error(`❌ Job ${jobId} failed:`, errorMessage)
      
      Sentry.captureException(error, {
        tags: { component: 'queue', operation: 'process_job', jobId },
        extra: { job }
      })
    }
  }

  /**
   * Execute the actual AI research request
   */
  private async executeResearchJob(job: QueueJob): Promise<any> {
    // Simulate the research API call
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/research`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await this.getAuthTokenForUser(job.userId)}`
      },
      body: JSON.stringify({
        query: job.query,
        outputFormat: job.outputFormat,
        sourceLimit: job.sourceLimit,
        focusArea: job.focusArea
      })
    })

    if (!response.ok) {
      throw new Error(`Research API returned ${response.status}: ${response.statusText}`)
    }

    // Handle streaming response
    if (response.headers.get('content-type')?.includes('text/stream')) {
      const reader = response.body?.getReader()
      let result = ''
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          result += new TextDecoder().decode(value)
        }
      }
      
      return { content: result, format: job.outputFormat }
    }

    return await response.json()
  }

  /**
   * Update job status and metadata
   */
  private async updateJobStatus(jobId: string, status: JobStatus, updates: Partial<QueueJob> = {}): Promise<void> {
    const now = new Date()

    try {
      if (redisClient && await this.isRedisHealthy()) {
        await redisClient.hSet(`queue:job:${jobId}`, {
          status,
          updatedAt: now.toISOString(),
          ...updates
        })
      } else if (supabase) {
        await supabase
          .from('queue_jobs')
          .update({
            status,
            updated_at: now.toISOString(),
            ...updates
          })
          .eq('id', jobId)
      } else {
        const currentJob = await prisma.researchQuery.findUnique({
          where: { id: jobId }
        })

        if (currentJob) {
          const updatedResult = {
            ...(currentJob.result as any),
            ...updates,
            status,
            updatedAt: now.toISOString()
          }

          await prisma.researchQuery.update({
            where: { id: jobId },
            data: {
              status: status.toUpperCase() as any,
              result: updatedResult,
              updatedAt: now
            }
          })
        }
      }
    } catch (error) {
      console.error(`Failed to update job ${jobId}:`, error)
    }
  }

  /**
   * Handle job failure with retry logic
   */
  private async handleJobFailure(jobId: string, error: Error): Promise<void> {
    try {
      await this.updateJobStatus(jobId, 'failed', {
        error: error.message
      })
      
      // Re-queue for retry if applicable
      await this.requeueJob(jobId)
    } catch (updateError) {
      console.error(`Failed to handle job failure for ${jobId}:`, updateError)
    }
  }

  /**
   * Move job to dead letter queue
   */
  private async moveToDeadLetter(job: QueueJob): Promise<void> {
    try {
      await this.updateJobStatus(job.id, 'dead_letter', {
        error: `Exceeded maximum retries (${job.maxRetries})`
      })

      // Log dead letter job
      await logUsage({
        userId: job.userId,
        endpoint: '/queue/dead_letter',
        method: 'POST',
        query: `Dead letter: ${job.query.substring(0, 100)}...`,
        ip: 'internal',
        timestamp: Date.now(),
        statusCode: 500,
        credits: 0,
        error: `Job failed after ${job.attempts} attempts`,
        metadata: { jobId: job.id }
      })

      console.warn(`💀 Job ${job.id} moved to dead letter queue after ${job.attempts} attempts`)

    } catch (error) {
      console.error(`Failed to move job ${job.id} to dead letter:`, error)
    }
  }

  /**
   * Re-queue a job for retry
   */
  private async requeueJob(jobId: string): Promise<void> {
    try {
      if (redisClient && await this.isRedisHealthy()) {
        await redisClient.lPush('queue:pending', jobId)
      }
      // For Supabase and Prisma, jobs are automatically picked up by status
    } catch (error) {
      console.error(`Failed to requeue job ${jobId}:`, error)
    }
  }

  /**
   * Check Redis health
   */
  private async isRedisHealthy(): Promise<boolean> {
    try {
      if (!redisClient) return false
      await redisClient.ping()
      return true
    } catch {
      return false
    }
  }

  /**
   * Get auth token for user (simplified for demo)
   */
  private async getAuthTokenForUser(userId: string): Promise<string> {
    // In a real implementation, this would generate a proper JWT token
    return `user_${userId}_token`
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    pending: number
    processing: number
    completed: number
    failed: number
    deadLetter: number
  }> {
    try {
      if (redisClient && await this.isRedisHealthy()) {
        const pending = await redisClient.lLen('queue:pending')
        // Additional Redis-based stats would require more complex tracking
        return { pending, processing: 0, completed: 0, failed: 0, deadLetter: 0 }
      } else if (supabase) {
        const { data, error } = await supabase
          .from('queue_jobs')
          .select('status')

        if (!error && data) {
          const stats = data.reduce((acc: any, job: any) => {
            acc[job.status] = (acc[job.status] || 0) + 1
            return acc
          }, {})

          return {
            pending: stats.pending || 0,
            processing: stats.processing || 0,
            completed: stats.completed || 0,
            failed: stats.failed || 0,
            deadLetter: stats.dead_letter || 0
          }
        }
      } else {
        const jobs = await prisma.researchQuery.findMany({
          where: {
            result: {
              path: ['queueJob'],
              equals: true
            }
          },
          select: { status: true }
        })

        const stats = jobs.reduce((acc: any, job: any) => {
          const status = job.status.toLowerCase()
          acc[status] = (acc[status] || 0) + 1
          return acc
        }, {})

        return {
          pending: stats.pending || 0,
          processing: stats.processing || 0,
          completed: stats.completed || 0,
          failed: stats.failed || 0,
          deadLetter: stats.dead_letter || 0
        }
      }
    } catch (error) {
      console.error('Failed to get queue stats:', error)
    }

    return { pending: 0, processing: 0, completed: 0, failed: 0, deadLetter: 0 }
  }

  /**
   * Clean up old completed/failed jobs
   */
  async cleanup(olderThanDays = 7): Promise<number> {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000)
    let cleanedCount = 0

    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('queue_jobs')
          .delete()
          .in('status', ['completed', 'failed', 'dead_letter'])
          .lt('updated_at', cutoffDate.toISOString())

        if (!error) {
          cleanedCount = data?.length || 0
        }
      } else {
        const result = await prisma.researchQuery.deleteMany({
          where: {
            updatedAt: { lt: cutoffDate },
            status: { in: ['COMPLETED', 'FAILED'] },
            result: {
              path: ['queueJob'],
              equals: true
            }
          }
        })
        cleanedCount = result.count
      }

      console.log(`🧹 Cleaned up ${cleanedCount} old queue jobs`)
      return cleanedCount

    } catch (error) {
      console.error('Queue cleanup failed:', error)
      return 0
    }
  }
}

// Export singleton instance
export const jobQueue = new JobQueue()

// Export the main function for external use
export const enqueueRetryJob = jobQueue.enqueueRetryJob.bind(jobQueue)

// Export other utilities
export { jobQueue as default }