'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import { Clock, Search, FileText, AlertCircle, CheckCircle, XCircle, Download, Filter } from 'lucide-react'

interface ResearchHistory {
  id: string
  query: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  credits: number
  createdAt: string
  updatedAt: string
  result?: any
}

export default function ResearchHistoryPage() {
  const { data: session, status } = useSession()
  const [history, setHistory] = useState<ResearchHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'completed' | 'failed' | 'pending'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (status === 'authenticated') {
      fetchHistory()
    }
  }, [status, filter, searchQuery, page])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(filter !== 'all' && { status: filter }),
        ...(searchQuery && { search: searchQuery })
      })

      const response = await fetch(`/api/user/history?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch research history')
      }

      const data = await response.json()
      setHistory(data.history || [])
      setTotalPages(data.totalPages || 1)
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const exportHistory = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(`/api/user/history/export?format=${format}`)
      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `research-history-${format === 'json' ? 'json' : 'csv'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(`Export failed: ${(err as Error).message}`)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'PROCESSING':
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please sign in to view your research history.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Research History</h1>
          <p className="text-gray-600">View and manage your AI research queries and results</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search queries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => exportHistory('json')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export JSON
              </button>
              <button
                onClick={() => exportHistory('csv')}
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
              <XCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading research history...</span>
            </div>
          </div>
        )}

        {/* History List */}
        {!loading && (
          <div className="space-y-4">
            {history.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No research history found</h3>
                <p className="text-gray-600">
                  {filter !== 'all' || searchQuery
                    ? 'Try adjusting your filters or search query.'
                    : 'Start by making your first AI research query.'}
                </p>
              </div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(item.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                        <span className="text-sm text-gray-500">
                          {item.credits} credit{item.credits !== 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-medium text-gray-900 mb-2 truncate">
                        {item.query}
                      </h3>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Created: {format(new Date(item.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                        {item.updatedAt !== item.createdAt && (
                          <span>Updated: {format(new Date(item.updatedAt), 'MMM dd, yyyy HH:mm')}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {item.status === 'COMPLETED' && item.result && (
                        <button
                          onClick={() => {
                            // Open result in modal or new page
                            const resultWindow = window.open('', '_blank')
                            if (resultWindow) {
                              resultWindow.document.write(`
                                <html>
                                  <head><title>Research Result</title></head>
                                  <body style="font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 2rem;">
                                    <h1>Research Result</h1>
                                    <h2>Query: ${item.query}</h2>
                                    <div style="background: #f5f5f5; padding: 1rem; border-radius: 8px; white-space: pre-wrap;">
                                      ${JSON.stringify(item.result, null, 2)}
                                    </div>
                                  </body>
                                </html>
                              `)
                              resultWindow.document.close()
                            }
                          }}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
                        >
                          View Result
                        </button>
                      )}
                      
                      {item.status === 'FAILED' && (
                        <button
                          onClick={() => {
                            // Retry functionality would go here
                            fetch('/api/user/retry', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ queryId: item.id })
                            }).then(() => fetchHistory())
                          }}
                          className="px-3 py-1 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors text-sm"
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            
            <span className="px-4 py-2 text-sm text-gray-700">
              Page {page} of {totalPages}
            </span>
            
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}