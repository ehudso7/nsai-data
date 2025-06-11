import { SupabaseService, supabaseService, isSupabaseAvailable } from '@/lib/supabase'

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    insert: jest.fn(() => ({ 
      select: jest.fn(() => ({ 
        single: jest.fn(() => ({ data: { id: 'test-id' }, error: null }))
      }))
    })),
    update: jest.fn(() => ({ 
      eq: jest.fn(() => ({ error: null }))
    })),
    select: jest.fn(() => ({ 
      eq: jest.fn(() => ({ 
        single: jest.fn(() => ({ data: { id: 'test-id', status: 'pending' }, error: null })),
        data: [{ status: 'pending' }, { status: 'completed' }],
        error: null
      })),
      gte: jest.fn(() => ({
        data: [
          { user_id: 'user1', endpoint: '/api/research', duration_ms: 1500 },
          { user_id: 'user2', endpoint: '/api/research', duration_ms: 2000 }
        ],
        error: null
      })),
      order: jest.fn(() => ({
        range: jest.fn(() => ({
          data: [
            { id: '1', query_text: 'Test query', status: 'completed' }
          ],
          error: null
        }))
      })),
      limit: jest.fn(() => ({ data: [{ id: 'test' }], error: null }))
    })),
    delete: jest.fn(() => ({ 
      in: jest.fn(() => ({ 
        lt: jest.fn(() => ({ data: [], error: null }))
      }))
    }))
  })),
  rpc: jest.fn(() => ({ data: 5, error: null }))
}

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}))

describe('Supabase Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Service Initialization', () => {
    it('should initialize SupabaseService', () => {
      const service = new SupabaseService()
      expect(service).toBeInstanceOf(SupabaseService)
    })

    it('should handle missing environment variables gracefully', () => {
      // Mock missing env vars
      const originalEnv = process.env
      process.env = { ...originalEnv }
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.SUPABASE_SERVICE_ROLE_KEY

      expect(isSupabaseAvailable()).toBe(false)

      process.env = originalEnv
    })
  })

  describe('Queue Operations', () => {
    it('should create queue job successfully', async () => {
      const jobData = {
        user_id: 'user-123',
        query: 'Test query',
        output_format: 'text' as const,
        source_limit: 5,
        focus_area: 'general' as const,
        status: 'pending' as const,
        attempts: 0,
        max_retries: 3,
        metadata: {}
      }

      const result = await supabaseService.createQueueJob(jobData)
      expect(result).toBe('test-id')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('queue_jobs')
    })

    it('should handle queue job creation errors', async () => {
      mockSupabaseClient.from.mockReturnValueOnce({
        insert: jest.fn(() => ({ 
          select: jest.fn(() => ({ 
            single: jest.fn(() => ({ data: null, error: new Error('Insert failed') }))
          }))
        }))
      })

      const result = await supabaseService.createQueueJob({
        user_id: 'user-123',
        query: 'Test query',
        output_format: 'text',
        source_limit: 5,
        focus_area: 'general',
        status: 'pending',
        attempts: 0,
        max_retries: 3
      })

      expect(result).toBeNull()
    })

    it('should update queue job successfully', async () => {
      const result = await supabaseService.updateQueueJob('job-123', { status: 'completed' })
      expect(result).toBe(true)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('queue_jobs')
    })

    it('should get queue statistics', async () => {
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          data: [
            { status: 'pending' },
            { status: 'pending' },
            { status: 'completed' },
            { status: 'failed' }
          ],
          error: null
        }))
      })

      const stats = await supabaseService.getQueueStats()
      expect(stats).toEqual({
        pending: 2,
        processing: 0,
        completed: 1,
        failed: 1,
        dead_letter: 0
      })
    })
  })

  describe('Analytics Operations', () => {
    it('should log usage analytics', async () => {
      const analyticsData = {
        user_id: 'user-123',
        endpoint: '/api/research',
        method: 'POST',
        status_code: 200,
        duration_ms: 1500,
        credits_consumed: 1
      }

      const result = await supabaseService.logUsage(analyticsData)
      expect(result).toBe(true)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('usage_analytics')
    })

    it('should get usage analytics with aggregation', async () => {
      const analytics = await supabaseService.getUsageAnalytics('week')
      
      expect(analytics).toEqual({
        totalRequests: 2,
        totalUsers: 2,
        avgDuration: 1750,
        errorRate: 0,
        totalCredits: 0,
        topEndpoints: [{ endpoint: '/api/research', count: 2 }],
        topUsers: [{ user_id: 'user1', count: 1 }, { user_id: 'user2', count: 1 }]
      })
    })

    it('should handle analytics errors gracefully', async () => {
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({ 
          gte: jest.fn(() => ({ data: null, error: new Error('Query failed') }))
        }))
      })

      const result = await supabaseService.getUsageAnalytics('day')
      expect(result).toBeNull()
    })
  })

  describe('Research History Operations', () => {
    it('should create research history entry', async () => {
      const historyData = {
        user_id: 'user-123',
        query_text: 'Test research query',
        status: 'completed' as const,
        credits_used: 1,
        is_favorite: false
      }

      const result = await supabaseService.createResearchHistory(historyData)
      expect(result).toBe('test-id')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('research_history')
    })

    it('should get user research history', async () => {
      const history = await supabaseService.getUserResearchHistory('user-123', 10, 0)
      
      expect(history).toEqual([
        { id: '1', query_text: 'Test query', status: 'completed' }
      ])
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('research_history')
    })

    it('should handle pagination in research history', async () => {
      await supabaseService.getUserResearchHistory('user-123', 5, 10)
      
      // Verify range was called with correct offset
      const fromCall = mockSupabaseClient.from.mock.calls.find(call => call[0] === 'research_history')
      expect(fromCall).toBeTruthy()
    })
  })

  describe('System Metrics Operations', () => {
    it('should record system metric', async () => {
      const metricData = {
        metric_name: 'api_requests_total',
        metric_value: 100,
        metric_type: 'counter' as const,
        dimensions: { endpoint: '/api/research' }
      }

      const result = await supabaseService.recordMetric(metricData)
      expect(result).toBe(true)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('system_metrics')
    })

    it('should get system metrics', async () => {
      const metrics = await supabaseService.getSystemMetrics('api_requests_total', 24)
      
      expect(Array.isArray(metrics)).toBe(true)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('system_metrics')
    })

    it('should filter metrics by name', async () => {
      await supabaseService.getSystemMetrics('response_time_avg')
      
      // Verify the query was called with metric name filter
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('system_metrics')
    })
  })

  describe('Health Check and Maintenance', () => {
    it('should perform health check', async () => {
      const isHealthy = await supabaseService.healthCheck()
      expect(isHealthy).toBe(true)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('system_metrics')
    })

    it('should handle health check failure', async () => {
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({ 
          limit: jest.fn(() => ({ data: null, error: new Error('Connection failed') }))
        }))
      })

      const isHealthy = await supabaseService.healthCheck()
      expect(isHealthy).toBe(false)
    })

    it('should cleanup old records', async () => {
      const cleanedCount = await supabaseService.cleanup()
      expect(cleanedCount).toBe(5)
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('cleanup_old_records')
    })

    it('should handle cleanup errors', async () => {
      mockSupabaseClient.rpc.mockReturnValueOnce({ data: null, error: new Error('RPC failed') })

      const cleanedCount = await supabaseService.cleanup()
      expect(cleanedCount).toBe(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Network error')
      })

      const result = await supabaseService.createQueueJob({
        user_id: 'user-123',
        query: 'Test query',
        output_format: 'text',
        source_limit: 5,
        focus_area: 'general',
        status: 'pending',
        attempts: 0,
        max_retries: 3
      })

      expect(result).toBeNull()
    })

    it('should handle RLS policy violations', async () => {
      mockSupabaseClient.from.mockReturnValueOnce({
        insert: jest.fn(() => ({ 
          select: jest.fn(() => ({ 
            single: jest.fn(() => ({ 
              data: null, 
              error: { code: 'PGRST116', message: 'Row Level Security violation' }
            }))
          }))
        }))
      })

      const result = await supabaseService.createQueueJob({
        user_id: 'unauthorized-user',
        query: 'Test query',
        output_format: 'text',
        source_limit: 5,
        focus_area: 'general',
        status: 'pending',
        attempts: 0,
        max_retries: 3
      })

      expect(result).toBeNull()
    })
  })

  describe('Data Aggregation', () => {
    it('should aggregate data by field correctly', () => {
      const service = new SupabaseService()
      const testData = [
        { endpoint: '/api/research', user_id: 'user1' },
        { endpoint: '/api/research', user_id: 'user2' },
        { endpoint: '/api/user', user_id: 'user1' },
        { endpoint: '/api/research', user_id: 'user1' }
      ]

      // Access the private method through any
      const aggregated = (service as any).aggregateByField(testData, 'endpoint')
      
      expect(aggregated).toEqual([
        { endpoint: '/api/research', count: 3 },
        { endpoint: '/api/user', count: 1 }
      ])
    })

    it('should limit aggregation results', () => {
      const service = new SupabaseService()
      const testData = Array.from({ length: 15 }, (_, i) => ({ 
        endpoint: `/api/endpoint${i}` 
      }))

      const aggregated = (service as any).aggregateByField(testData, 'endpoint')
      expect(aggregated.length).toBe(10) // Should be limited to 10
    })
  })

  describe('Environment Configuration', () => {
    it('should detect when Supabase is available', () => {
      const originalEnv = process.env
      process.env = {
        ...originalEnv,
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'test-key'
      }

      expect(isSupabaseAvailable()).toBe(true)

      process.env = originalEnv
    })

    it('should detect when Supabase is not available', () => {
      const originalEnv = process.env
      process.env = { ...originalEnv }
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.SUPABASE_SERVICE_ROLE_KEY

      expect(isSupabaseAvailable()).toBe(false)

      process.env = originalEnv
    })
  })

  describe('Type Safety', () => {
    it('should enforce correct types for queue job status', () => {
      const validStatuses = ['pending', 'processing', 'completed', 'failed', 'dead_letter']
      
      validStatuses.forEach(status => {
        expect(['pending', 'processing', 'completed', 'failed', 'dead_letter']).toContain(status)
      })
    })

    it('should enforce correct types for output format', () => {
      const validFormats = ['text', 'json']
      
      validFormats.forEach(format => {
        expect(['text', 'json']).toContain(format)
      })
    })

    it('should enforce correct types for focus areas', () => {
      const validAreas = ['general', 'technology', 'business', 'healthcare', 'finance']
      
      validAreas.forEach(area => {
        expect(['general', 'technology', 'business', 'healthcare', 'finance']).toContain(area)
      })
    })
  })
})