'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts'
import { 
  Users, Activity, CreditCard, AlertTriangle, 
  Download, Filter, Calendar, TrendingUp, Clock,
  Database, Server, Zap
} from 'lucide-react'

interface UsageMetrics {
  totalRequests: number
  totalUsers: number
  avgDuration: number
  totalCredits: number
  errorRate: number
  topEndpoints: Array<{ endpoint: string; count: number }>
  topUsers: Array<{ userId: string; count: number; email?: string }>
}

interface TimeSeriesData {
  date: string
  requests: number
  users: number
  errors: number
  avgDuration: number
}

interface QueueStats {
  pending: number
  processing: number
  completed: number
  failed: number
  deadLetter: number
}

export default function AdminUsageDashboard() {
  const { data: session, status } = useSession()
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null)
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([])
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('week')
  const [refreshInterval, setRefreshInterval] = useState<number | null>(30000) // 30 seconds

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchDashboardData()
      
      // Set up auto-refresh
      if (refreshInterval) {
        const interval = setInterval(fetchDashboardData, refreshInterval)
        return () => clearInterval(interval)
      }
    }
  }, [status, session, timeframe, refreshInterval])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch all data in parallel
      const [metricsRes, timeSeriesRes, queueRes] = await Promise.all([
        fetch(`/api/admin/metrics?timeframe=${timeframe}`),
        fetch(`/api/admin/timeseries?timeframe=${timeframe}`),
        fetch(`/api/admin/queue-stats`)
      ])

      if (!metricsRes.ok || !timeSeriesRes.ok || !queueRes.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const [metricsData, timeSeriesData, queueData] = await Promise.all([
        metricsRes.json(),
        timeSeriesRes.json(),
        queueRes.json()
      ])

      setMetrics(metricsData)
      setTimeSeriesData(timeSeriesData)
      setQueueStats(queueData)
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const exportMetrics = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(`/api/admin/export?format=${format}&timeframe=${timeframe}`)
      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `usage-metrics-${timeframe}-${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(`Export failed: ${(err as Error).message}`)
    }
  }

  // Color scheme for charts
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316']

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Admin privileges required to view this dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Usage Analytics Dashboard</h1>
              <p className="text-gray-600">Monitor system performance, usage patterns, and user activity</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Auto-refresh toggle */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={refreshInterval !== null}
                  onChange={(e) => setRefreshInterval(e.target.checked ? 30000 : null)}
                  className="rounded"
                />
                <span className="text-sm text-gray-600">Auto-refresh</span>
              </label>
              
              {/* Last updated */}
              {!loading && (
                <span className="text-sm text-gray-500">
                  Last updated: {format(new Date(), 'HH:mm:ss')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Timeframe selector */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="day">Last 24 Hours</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>

              <button
                onClick={fetchDashboardData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Activity className="w-4 h-4" />
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {/* Export buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => exportMetrics('json')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export JSON
              </button>
              <button
                onClick={() => exportMetrics('csv')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && !metrics && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading dashboard data...</span>
            </div>
          </div>
        )}

        {/* Main Dashboard Content */}
        {metrics && (
          <>
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Requests</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics.totalRequests.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics.totalUsers.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                    <p className="text-2xl font-bold text-gray-900">{(metrics.avgDuration / 1000).toFixed(1)}s</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Error Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics.errorRate.toFixed(1)}%</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    metrics.errorRate > 5 ? 'bg-red-100' : 'bg-green-100'
                  }`}>
                    <AlertTriangle className={`w-6 h-6 ${
                      metrics.errorRate > 5 ? 'text-red-600' : 'text-green-600'
                    }`} />
                  </div>
                </div>
              </div>
            </div>

            {/* Queue Status */}
            {queueStats && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  Job Queue Status
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">{queueStats.pending}</p>
                    <p className="text-sm text-gray-600">Pending</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{queueStats.processing}</p>
                    <p className="text-sm text-gray-600">Processing</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{queueStats.completed}</p>
                    <p className="text-sm text-gray-600">Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{queueStats.failed}</p>
                    <p className="text-sm text-gray-600">Failed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-600">{queueStats.deadLetter}</p>
                    <p className="text-sm text-gray-600">Dead Letter</p>
                  </div>
                </div>
              </div>
            )}

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Requests Over Time */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Requests Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="requests" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Top Endpoints */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Endpoints</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.topEndpoints.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="endpoint" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Response Time Trend */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Time Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`${value}ms`, 'Avg Duration']} />
                    <Line type="monotone" dataKey="avgDuration" stroke="#F59E0B" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Error Rate Trend */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Error Rate Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`${value}`, 'Errors']} />
                    <Line type="monotone" dataKey="errors" stroke="#EF4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Users Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Users by Activity</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Requests
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Activity
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {metrics.topUsers.slice(0, 10).map((user, index) => (
                      <tr key={user.userId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {user.userId.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.email || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(user.count / metrics.topUsers[0].count) * 100}%` }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}