'use client'

import { useState } from 'react'
import { ResearchInterface } from '@/components/ResearchInterface'
import { Header } from '@/components/Header'

interface DashboardData {
  user: {
    name: string
    email: string
    plan: string
    credits: number
    apiKey: string | null
  }
  usage: {
    queries_used: number
    queries_limit: number
    credits_remaining: number
    avg_response_time: number
    total_reports: number
  }
  recentQueries: Array<{
    id: string
    query: string
    status: string
    createdAt: Date
    credits: number
  }>
  rateLimit: string
}

export function DashboardClient({ data }: { data: DashboardData }) {
  const [showApiKey, setShowApiKey] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  const handleCopyApiKey = () => {
    if (data.user.apiKey) {
      navigator.clipboard.writeText(data.user.apiKey)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }

  const percentageUsed = data.usage.queries_limit > 0 
    ? (data.usage.queries_used / data.usage.queries_limit) * 100 
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {data.user.name}!</h1>
          <p className="text-gray-600 mt-2">
            You're on the <span className="font-semibold capitalize">{data.user.plan}</span> plan
          </p>
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Queries Used</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {data.usage.queries_used}
                  {data.usage.queries_limit > 0 && (
                    <span className="text-sm text-gray-500">/{data.usage.queries_limit}</span>
                  )}
                </p>
              </div>
              <div className="text-blue-500">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            {data.usage.queries_limit > 0 && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Credits Remaining</p>
                <p className="text-2xl font-semibold text-gray-900">{data.user.credits}</p>
              </div>
              <div className="text-green-500">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-semibold text-gray-900">{data.usage.avg_response_time}s</p>
              </div>
              <div className="text-purple-500">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Reports</p>
                <p className="text-2xl font-semibold text-gray-900">{data.usage.total_reports}</p>
              </div>
              <div className="text-indigo-500">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* API Key Section */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">API Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
              <div className="flex items-center space-x-2">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={data.user.apiKey || 'No API key generated'}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  {showApiKey ? 'Hide' : 'Show'}
                </button>
                <button
                  onClick={handleCopyApiKey}
                  disabled={!data.user.apiKey}
                  className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  {copySuccess ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rate Limit</label>
              <p className="text-sm text-gray-600">{data.rateLimit}</p>
            </div>
          </div>
        </div>

        {/* Recent Queries */}
        {data.recentQueries.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-semibold mb-4">Recent Queries</h2>
            <div className="space-y-2">
              {data.recentQueries.map((query) => (
                <div key={query.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{query.query}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(query.createdAt).toLocaleDateString()} • {query.credits} credit{query.credits !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    query.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    query.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {query.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Research Interface */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">New Research Query</h2>
          <ResearchInterface onQueryComplete={() => window.location.reload()} />
        </div>
      </main>
    </div>
  )
}