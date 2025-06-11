import Redis from 'redis'
import { LRUCache } from 'lru-cache'

// Elite caching layer with multi-tier strategy
export interface CacheConfig {
  ttl: number
  maxSize?: number
  staleWhileRevalidate?: boolean
}

class EliteCacheService {
  private memoryCache: LRUCache<string, any>
  private redisClient: any
  private compressionEnabled = true

  constructor() {
    // In-memory LRU cache for hot data
    this.memoryCache = new LRUCache({
      max: 1000, // Maximum 1000 items
      maxSize: 50 * 1024 * 1024, // 50MB
      sizeCalculation: (value) => JSON.stringify(value).length,
      ttl: 1000 * 60 * 5, // 5 minutes default
      updateAgeOnGet: true,
      allowStale: true // Return stale while revalidating
    })

    // Redis for distributed cache
    if (process.env.REDIS_URL) {
      try {
        this.redisClient = Redis.createClient({
          url: process.env.REDIS_URL,
          socket: {
            connectTimeout: 5000,
            keepAlive: true,
            keepAliveInitialDelay: 30000
          }
        })
        
        this.redisClient.on('error', (err: Error) => {
          console.warn('Redis cache error:', err.message)
          // Fallback to memory-only mode
          this.redisClient = null
        })
        
        this.redisClient.connect()
      } catch (error) {
        console.warn('Redis cache initialization failed:', error)
        this.redisClient = null
      }
    }
  }

  /**
   * Get value with multi-tier fallback
   */
  async get<T>(key: string): Promise<T | null> {
    // Try memory cache first (fastest)
    const memoryValue = this.memoryCache.get(key)
    if (memoryValue !== undefined) {
      return memoryValue as T
    }

    // Try Redis (distributed)
    if (this.redisClient) {
      try {
        const redisValue = await this.redisClient.get(key)
        if (redisValue) {
          const parsed = JSON.parse(redisValue)
          // Populate memory cache for next time
          this.memoryCache.set(key, parsed)
          return parsed as T
        }
      } catch (error) {
        console.warn(`Redis get error for key ${key}:`, error)
      }
    }

    return null
  }

  /**
   * Set value in all cache tiers
   */
  async set<T>(key: string, value: T, config?: CacheConfig): Promise<void> {
    const ttl = config?.ttl || 300000 // 5 minutes default

    // Set in memory cache
    this.memoryCache.set(key, value, { ttl })

    // Set in Redis
    if (this.redisClient) {
      try {
        const serialized = JSON.stringify(value)
        await this.redisClient.setEx(key, Math.floor(ttl / 1000), serialized)
      } catch (error) {
        console.warn(`Redis set error for key ${key}:`, error)
      }
    }
  }

  /**
   * Delete from all cache tiers
   */
  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key)
    
    if (this.redisClient) {
      try {
        await this.redisClient.del(key)
      } catch (error) {
        console.warn(`Redis delete error for key ${key}:`, error)
      }
    }
  }

  /**
   * Clear all caches
   */
  async clear(): Promise<void> {
    this.memoryCache.clear()
    
    if (this.redisClient) {
      try {
        await this.redisClient.flushDb()
      } catch (error) {
        console.warn('Redis clear error:', error)
      }
    }
  }

  /**
   * Get or set with callback (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string, 
    factory: () => Promise<T>, 
    config?: CacheConfig
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key)
    if (cached !== null) {
      // If stale while revalidate is enabled, refresh in background
      if (config?.staleWhileRevalidate) {
        this.refreshInBackground(key, factory, config)
      }
      return cached
    }

    // Generate fresh value
    const fresh = await factory()
    await this.set(key, fresh, config)
    return fresh
  }

  /**
   * Refresh cache in background
   */
  private async refreshInBackground<T>(
    key: string,
    factory: () => Promise<T>,
    config?: CacheConfig
  ): Promise<void> {
    // Don't await - let it run in background
    factory()
      .then(fresh => this.set(key, fresh, config))
      .catch(error => console.error(`Background refresh failed for ${key}:`, error))
  }

  /**
   * Batch get for multiple keys
   */
  async mget<T>(keys: string[]): Promise<Map<string, T>> {
    const results = new Map<string, T>()

    // Get from memory cache first
    const memoryMisses: string[] = []
    for (const key of keys) {
      const value = this.memoryCache.get(key)
      if (value !== undefined) {
        results.set(key, value as T)
      } else {
        memoryMisses.push(key)
      }
    }

    // Get remaining from Redis
    if (this.redisClient && memoryMisses.length > 0) {
      try {
        const redisValues = await this.redisClient.mGet(memoryMisses)
        redisValues.forEach((value: string | null, index: number) => {
          if (value) {
            const parsed = JSON.parse(value)
            const key = memoryMisses[index]
            results.set(key, parsed as T)
            // Populate memory cache
            this.memoryCache.set(key, parsed)
          }
        })
      } catch (error) {
        console.warn('Redis mget error:', error)
      }
    }

    return results
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      memory: {
        size: this.memoryCache.size,
        calculatedSize: this.memoryCache.calculatedSize || 0,
        itemCount: this.memoryCache.size,
        maxSize: 50 * 1024 * 1024
      },
      redis: {
        connected: !!this.redisClient?.isReady
      }
    }
  }
}

// Export singleton instance
export const cache = new EliteCacheService()

// Cache key generators
export const cacheKeys = {
  user: (userId: string) => `user:${userId}`,
  userPlan: (userId: string) => `user:plan:${userId}`,
  rateLimit: (identifier: string) => `ratelimit:${identifier}`,
  research: (queryHash: string) => `research:${queryHash}`,
  session: (sessionId: string) => `session:${sessionId}`,
  metrics: (timeframe: string) => `metrics:${timeframe}`,
  queueStats: () => 'queue:stats'
}

// Cache configurations
export const cacheConfigs = {
  user: { ttl: 1000 * 60 * 60 }, // 1 hour
  userPlan: { ttl: 1000 * 60 * 30 }, // 30 minutes
  rateLimit: { ttl: 1000 * 60 * 5 }, // 5 minutes
  research: { ttl: 1000 * 60 * 60 * 24 }, // 24 hours
  session: { ttl: 1000 * 60 * 30 }, // 30 minutes
  metrics: { ttl: 1000 * 60 * 2, staleWhileRevalidate: true }, // 2 minutes
  queueStats: { ttl: 1000 * 30 } // 30 seconds
}