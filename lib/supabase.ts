import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Service role client (for server-side operations)
export const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Anonymous client (for client-side operations)
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Database types for type safety
export interface QueueJob {
  id: string
  user_id: string
  query: string
  output_format: 'text' | 'json'
  source_limit: number
  focus_area: 'general' | 'technology' | 'business' | 'healthcare' | 'finance'
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'dead_letter'
  attempts: number
  max_retries: number
  next_retry?: string
  error?: string
  result?: any
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface UsageAnalytics {
  id: string
  user_id: string
  endpoint: string
  method: string
  status_code: number
  duration_ms?: number
  tokens_used?: number
  credits_consumed: number
  ip_address?: string
  user_agent?: string
  request_size?: number
  response_size?: number
  error_message?: string
  metadata?: Record<string, any>
  created_at: string
}

export interface ResearchHistory {
  id: string
  user_id: string
  query_text: string
  query_hash: string
  parameters?: Record<string, any>
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result_summary?: string
  result_data?: any
  credits_used: number
  processing_time_ms?: number
  error_details?: string
  tags?: string[]
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export interface SystemMetrics {
  id: string
  metric_name: string
  metric_value: number
  metric_type: 'gauge' | 'counter' | 'histogram'
  dimensions?: Record<string, any>
  recorded_at: string
}

// Utility functions for Supabase operations
export class SupabaseService {
  private client = supabaseAdmin

  constructor() {
    if (!this.client) {
      console.warn('Supabase client not initialized - falling back to Prisma')
    }
  }

  // Queue operations
  async createQueueJob(job: Omit<QueueJob, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> {
    if (!this.client) return null

    try {
      const { data, error } = await this.client
        .from('queue_jobs')
        .insert([job])
        .select('id')
        .single()

      if (error) throw error
      return data.id
    } catch (error) {
      console.error('Failed to create queue job:', error)
      return null
    }
  }

  async updateQueueJob(id: string, updates: Partial<QueueJob>): Promise<boolean> {
    if (!this.client) return false

    try {
      const { error } = await this.client
        .from('queue_jobs')
        .update(updates)
        .eq('id', id)

      return !error
    } catch (error) {
      console.error('Failed to update queue job:', error)
      return false
    }
  }

  async getQueueStats(): Promise<Record<string, number>> {
    if (!this.client) {
      return { pending: 0, processing: 0, completed: 0, failed: 0, dead_letter: 0 }
    }

    try {
      const { data, error } = await this.client
        .from('queue_jobs')
        .select('status')

      if (error) throw error

      const stats = data.reduce((acc: Record<string, number>, job: any) => {
        acc[job.status] = (acc[job.status] || 0) + 1
        return acc
      }, {})

      return {
        pending: stats.pending || 0,
        processing: stats.processing || 0,
        completed: stats.completed || 0,
        failed: stats.failed || 0,
        dead_letter: stats.dead_letter || 0
      }
    } catch (error) {
      console.error('Failed to get queue stats:', error)
      return { pending: 0, processing: 0, completed: 0, failed: 0, dead_letter: 0 }
    }
  }

  // Analytics operations
  async logUsage(analytics: Omit<UsageAnalytics, 'id' | 'created_at'>): Promise<boolean> {
    if (!this.client) return false

    try {
      const { error } = await this.client
        .from('usage_analytics')
        .insert([analytics])

      return !error
    } catch (error) {
      console.error('Failed to log usage analytics:', error)
      return false
    }
  }

  async getUsageAnalytics(timeframe: 'hour' | 'day' | 'week' | 'month'): Promise<any> {
    if (!this.client) return null

    try {
      const intervals = {
        hour: '1 hour',
        day: '1 day',
        week: '7 days',
        month: '30 days'
      }

      const { data, error } = await this.client
        .from('usage_analytics')
        .select('*')
        .gte('created_at', `now() - interval '${intervals[timeframe]}'`)

      if (error) throw error

      // Process data for analytics
      const totalRequests = data.length
      const totalUsers = new Set(data.map(item => item.user_id)).size
      const avgDuration = data.reduce((sum, item) => sum + (item.duration_ms || 0), 0) / totalRequests
      const errorCount = data.filter(item => item.status_code >= 400).length
      const errorRate = (errorCount / totalRequests) * 100

      return {
        totalRequests,
        totalUsers,
        avgDuration,
        errorRate,
        totalCredits: data.reduce((sum, item) => sum + item.credits_consumed, 0),
        topEndpoints: this.aggregateByField(data, 'endpoint'),
        topUsers: this.aggregateByField(data, 'user_id')
      }
    } catch (error) {
      console.error('Failed to get usage analytics:', error)
      return null
    }
  }

  // Research history operations
  async createResearchHistory(history: Omit<ResearchHistory, 'id' | 'query_hash' | 'created_at' | 'updated_at'>): Promise<string | null> {
    if (!this.client) return null

    try {
      const { data, error } = await this.client
        .from('research_history')
        .insert([history])
        .select('id')
        .single()

      if (error) throw error
      return data.id
    } catch (error) {
      console.error('Failed to create research history:', error)
      return null
    }
  }

  async getUserResearchHistory(userId: string, limit = 10, offset = 0): Promise<ResearchHistory[]> {
    if (!this.client) return []

    try {
      const { data, error } = await this.client
        .from('research_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return data as ResearchHistory[]
    } catch (error) {
      console.error('Failed to get user research history:', error)
      return []
    }
  }

  // System metrics operations
  async recordMetric(metric: Omit<SystemMetrics, 'id' | 'recorded_at'>): Promise<boolean> {
    if (!this.client) return false

    try {
      const { error } = await this.client
        .from('system_metrics')
        .insert([metric])

      return !error
    } catch (error) {
      console.error('Failed to record system metric:', error)
      return false
    }
  }

  async getSystemMetrics(metricName?: string, hoursBack = 24): Promise<SystemMetrics[]> {
    if (!this.client) return []

    try {
      let query = this.client
        .from('system_metrics')
        .select('*')
        .gte('recorded_at', `now() - interval '${hoursBack} hours'`)
        .order('recorded_at', { ascending: false })

      if (metricName) {
        query = query.eq('metric_name', metricName)
      }

      const { data, error } = await query

      if (error) throw error
      return data as SystemMetrics[]
    } catch (error) {
      console.error('Failed to get system metrics:', error)
      return []
    }
  }

  // Utility functions
  private aggregateByField(data: any[], field: string): Array<{ [key: string]: any; count: number }> {
    const aggregated = data.reduce((acc: Record<string, number>, item: any) => {
      const value = item[field]
      acc[value] = (acc[value] || 0) + 1
      return acc
    }, {})

    return Object.entries(aggregated)
      .map(([key, count]) => ({ [field]: key, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    if (!this.client) return false

    try {
      const { data, error } = await this.client
        .from('system_metrics')
        .select('id')
        .limit(1)

      return !error
    } catch (error) {
      console.error('Supabase health check failed:', error)
      return false
    }
  }

  // Cleanup operations
  async cleanup(): Promise<number> {
    if (!this.client) return 0

    try {
      const { data, error } = await this.client
        .rpc('cleanup_old_records')

      if (error) throw error
      return data || 0
    } catch (error) {
      console.error('Failed to cleanup old records:', error)
      return 0
    }
  }
}

// Export singleton instance
export const supabaseService = new SupabaseService()

// Helper function to check if Supabase is available
export const isSupabaseAvailable = (): boolean => {
  return !!(supabaseUrl && (supabaseServiceKey || supabaseAnonKey))
}

// RLS helper functions for client-side usage
export const withAuth = (client: any) => {
  return {
    ...client,
    auth: {
      ...client.auth,
      onAuthStateChange: (callback: (event: string, session: any) => void) => {
        return client.auth.onAuthStateChange(callback)
      }
    }
  }
}