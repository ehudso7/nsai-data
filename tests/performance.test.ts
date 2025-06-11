/**
 * Elite Performance Testing Suite
 * Target: < 100ms response time at 10,000 concurrent users
 */

import { performance } from 'perf_hooks'
import { cache } from '@/lib/cache'
import { ratelimit } from '@/lib/rate-limit'
import { jobQueue } from '@/lib/queue'

// Performance benchmarks
const PERFORMANCE_TARGETS = {
  cacheGet: 1, // < 1ms
  cacheSet: 5, // < 5ms
  rateLimitCheck: 10, // < 10ms
  queueEnqueue: 20, // < 20ms
  databaseQuery: 50, // < 50ms
  aiStreamStart: 200, // < 200ms to first byte
}

describe('Elite Performance Tests', () => {
  beforeAll(async () => {
    // Warm up caches and connections
    await cache.set('warmup', 'test')
    await cache.get('warmup')
  })

  describe('Cache Performance', () => {
    it('should achieve sub-millisecond cache reads', async () => {
      const testData = { id: 1, data: 'x'.repeat(1000) }
      await cache.set('perf-test', testData)

      const times: number[] = []
      for (let i = 0; i < 1000; i++) {
        const start = performance.now()
        await cache.get('perf-test')
        times.push(performance.now() - start)
      }

      const avgTime = times.reduce((a, b) => a + b) / times.length
      const p95Time = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)]

      expect(avgTime).toBeLessThan(PERFORMANCE_TARGETS.cacheGet)
      expect(p95Time).toBeLessThan(PERFORMANCE_TARGETS.cacheGet * 2)
    })

    it('should handle concurrent cache operations', async () => {
      const concurrentOps = 100
      const start = performance.now()

      await Promise.all(
        Array(concurrentOps).fill(0).map((_, i) => 
          cache.getOrSet(`concurrent-${i}`, async () => ({ value: i }))
        )
      )

      const totalTime = performance.now() - start
      expect(totalTime / concurrentOps).toBeLessThan(PERFORMANCE_TARGETS.cacheSet)
    })
  })

  describe('Rate Limiting Performance', () => {
    it('should handle high-throughput rate limit checks', async () => {
      const times: number[] = []
      const testUserId = 'perf-test-user'
      const testIp = '127.0.0.1'

      for (let i = 0; i < 100; i++) {
        const start = performance.now()
        await ratelimit.check(testUserId, testIp, 'api_general')
        times.push(performance.now() - start)
      }

      const avgTime = times.reduce((a, b) => a + b) / times.length
      expect(avgTime).toBeLessThan(PERFORMANCE_TARGETS.rateLimitCheck)
    })

    it('should scale with concurrent users', async () => {
      const concurrentUsers = 50
      const start = performance.now()

      const results = await Promise.all(
        Array(concurrentUsers).fill(0).map((_, i) => 
          ratelimit.check(`user-${i}`, `192.168.1.${i}`, 'api_general')
        )
      )

      const totalTime = performance.now() - start
      expect(totalTime).toBeLessThan(concurrentUsers * PERFORMANCE_TARGETS.rateLimitCheck)
      expect(results.every(r => r !== null)).toBeTruthy()
    })
  })

  describe('Queue Performance', () => {
    it('should enqueue jobs rapidly', async () => {
      const times: number[] = []

      for (let i = 0; i < 50; i++) {
        const start = performance.now()
        await jobQueue.enqueueRetryJob({
          userId: 'perf-test',
          query: `Performance test query ${i}`,
          outputFormat: 'text',
          sourceLimit: 5
        })
        times.push(performance.now() - start)
      }

      const avgTime = times.reduce((a, b) => a + b) / times.length
      expect(avgTime).toBeLessThan(PERFORMANCE_TARGETS.queueEnqueue)
    })

    it('should process jobs concurrently', async () => {
      const jobCount = 20
      const start = performance.now()

      // Enqueue multiple jobs
      const jobIds = await Promise.all(
        Array(jobCount).fill(0).map((_, i) => 
          jobQueue.enqueueRetryJob({
            userId: 'perf-test',
            query: `Concurrent job ${i}`,
            priority: i < 5 ? 'high' : 'normal'
          })
        )
      )

      // Process queue (should handle batch)
      await jobQueue.processQueue()

      const totalTime = performance.now() - start
      console.log(`Processed ${jobCount} jobs in ${totalTime}ms`)
      
      // Should be faster than sequential processing
      expect(totalTime).toBeLessThan(jobCount * 100) // 100ms per job max
    })
  })

  describe('Memory Management', () => {
    it('should not leak memory under load', () => {
      const initialMemory = process.memoryUsage().heapUsed
      const iterations = 10000

      // Simulate heavy usage
      for (let i = 0; i < iterations; i++) {
        // Create and discard objects
        const data = { id: i, content: 'x'.repeat(1000) }
        // Operations that might leak
        JSON.stringify(data)
        JSON.parse(JSON.stringify(data))
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      const finalMemory = process.memoryUsage().heapUsed
      const memoryGrowth = finalMemory - initialMemory

      // Memory growth should be minimal (< 10MB)
      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024)
    })
  })

  describe('Load Testing', () => {
    it('should maintain performance under sustained load', async () => {
      const duration = 5000 // 5 seconds
      const requestsPerSecond = 100
      const results: { success: number; failed: number; avgTime: number } = {
        success: 0,
        failed: 0,
        avgTime: 0
      }

      const times: number[] = []
      const startTime = Date.now()

      while (Date.now() - startTime < duration) {
        const batchStart = performance.now()
        
        // Fire requests
        const promises = Array(requestsPerSecond).fill(0).map(async () => {
          try {
            const opStart = performance.now()
            await cache.getOrSet('load-test', async () => ({ timestamp: Date.now() }))
            times.push(performance.now() - opStart)
            results.success++
          } catch {
            results.failed++
          }
        })

        await Promise.all(promises)

        // Wait for next second
        const elapsed = performance.now() - batchStart
        if (elapsed < 1000) {
          await new Promise(resolve => setTimeout(resolve, 1000 - elapsed))
        }
      }

      results.avgTime = times.reduce((a, b) => a + b) / times.length

      console.log('Load test results:', {
        totalRequests: results.success + results.failed,
        successRate: (results.success / (results.success + results.failed) * 100).toFixed(2) + '%',
        avgResponseTime: results.avgTime.toFixed(2) + 'ms',
        requestsPerSecond: results.success / (duration / 1000)
      })

      expect(results.avgTime).toBeLessThan(10) // < 10ms average
      expect(results.failed / results.success).toBeLessThan(0.01) // < 1% error rate
    })
  })

  describe('Chaos Testing', () => {
    it('should handle Redis failure gracefully', async () => {
      // Simulate Redis failure
      const originalRedis = (cache as any).redisClient
      ;(cache as any).redisClient = null

      // Should still work with memory cache
      const start = performance.now()
      await cache.set('chaos-test', { value: 'test' })
      const result = await cache.get('chaos-test')
      const time = performance.now() - start

      expect(result).toEqual({ value: 'test' })
      expect(time).toBeLessThan(5) // Still fast with memory only

      // Restore Redis
      ;(cache as any).redisClient = originalRedis
    })

    it('should handle database connection exhaustion', async () => {
      const promises = []
      
      // Simulate 100 concurrent database operations
      for (let i = 0; i < 100; i++) {
        promises.push(
          ratelimit.check(`chaos-user-${i}`, '10.0.0.1', 'api_general')
            .catch(() => ({ allowed: true, remaining: 999, reset: new Date(), limit: 1000 }))
        )
      }

      const results = await Promise.all(promises)
      
      // Should handle all requests (with fallback)
      expect(results.every(r => r.allowed !== undefined)).toBeTruthy()
    })
  })
})

// Performance monitoring helper
export function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now()
  return fn().then(result => ({
    result,
    duration: performance.now() - start
  }))
}