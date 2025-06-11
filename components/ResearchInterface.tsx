'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { sanitizeInput } from '@/lib/utils'

interface ResearchResponse {
  research_id: string
  status: string
  report?: string
  metadata?: any
  sources?: any[]
  duration_ms?: number
  error?: string
}

interface ResearchInterfaceProps {
  onQueryComplete?: () => void
}

export function ResearchInterface({ onQueryComplete }: ResearchInterfaceProps = {}) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ResearchResponse | null>(null)
  const [error, setError] = useState('')
  const [outputFormat, setOutputFormat] = useState<'markdown' | 'json' | 'html'>('markdown')
  const [maxSources, setMaxSources] = useState(10)
  const [history, setHistory] = useState<ResearchResponse[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedQuery = query.trim()
    if (!trimmedQuery) {
      setError('Please enter a research query')
      return
    }

    if (trimmedQuery.length < 10) {
      setError('Query must be at least 10 characters long')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      // Always call the real API - it will handle demo mode internally
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: sanitizeInput(trimmedQuery),
          output_format: outputFormat,
          max_sources: maxSources
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process research query')
      }

      setResult(data)
      
      // Add to history
      setHistory(prev => [data, ...prev.slice(0, 4)]) // Keep last 5 results
      
      // Call callback if provided
      if (onQueryComplete) {
        onQueryComplete()
      }
    } catch (err) {
      setError('Failed to process research query. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
              Research Query
            </label>
            <textarea
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={3}
              placeholder="Enter your research question... (e.g., 'What are the latest developments in quantum computing?')"
              disabled={loading}
            />
          </div>
          
          {/* Advanced Options */}
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-2"
            >
              Advanced Options
              <svg 
                className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showAdvanced && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="output-format" className="block text-sm font-medium text-gray-700 mb-1">
                      Output Format
                    </label>
                    <select
                      id="output-format"
                      value={outputFormat}
                      onChange={(e) => setOutputFormat(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="markdown">Markdown</option>
                      <option value="json">JSON</option>
                      <option value="html">HTML</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="max-sources" className="block text-sm font-medium text-gray-700 mb-1">
                      Max Sources ({maxSources})
                    </label>
                    <input
                      type="range"
                      id="max-sources"
                      min="5"
                      max="50"
                      value={maxSources}
                      onChange={(e) => setMaxSources(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>5</span>
                      <span>25</span>
                      <span>50</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-600">
              Demo Mode - Sign up for full access
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing<span className="loading-dots"></span>
                </>
              ) : (
                'Start Research'
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
      </div>

      {loading && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Research Progress</h3>
          <div className="space-y-4">
            {['Query Analysis', 'Web Search', 'Content Extraction', 'Insight Generation', 'Report Formatting', 'Validation'].map((step, index) => (
              <div key={step} className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  index < 3 ? 'bg-green-500' : index === 3 ? 'bg-primary-500 animate-pulse' : 'bg-gray-300'
                }`}>
                  {index < 3 ? (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : index === 3 ? (
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  ) : null}
                </div>
                <span className={index <= 3 ? 'text-gray-900' : 'text-gray-400'}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Query History */}
      {history.length > 0 && !result && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Recent Queries</h3>
          <div className="space-y-3">
            {history.map((item, index) => (
              <div 
                key={index} 
                className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition"
                onClick={() => setResult(item)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">
                      {item.research_id ? `Query ${item.research_id.slice(-8)}` : 'Research Query'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {((item.duration_ms || 0) / 1000).toFixed(1)}s • {item.metadata?.sources_analyzed || 0} sources
                    </p>
                  </div>
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Research Results</h2>
            <div className="flex space-x-2">
              <button 
                onClick={() => {
                  setResult(null)
                  setQuery('')
                  setError('')
                }}
                className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200"
              >
                New Query
              </button>
              <button 
                onClick={() => {
                  const blob = new Blob([result.report || ''], { type: 'text/markdown' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `research-${result.research_id}.md`
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                  URL.revokeObjectURL(url)
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Download
              </button>
              <button 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'Research Report',
                      text: result.report?.substring(0, 200) + '...',
                      url: window.location.href
                    })
                  } else {
                    navigator.clipboard.writeText(window.location.href)
                    alert('Link copied to clipboard!')
                  }
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Share
              </button>
            </div>
          </div>

          <div className="prose prose-lg max-w-none mb-8">
            <ReactMarkdown>{result.report || ''}</ReactMarkdown>
          </div>

          {result.metadata && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Research Metadata</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Sources Analyzed</p>
                  <p className="text-2xl font-bold">{result.metadata.sources_analyzed || 0}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Processing Time</p>
                  <p className="text-2xl font-bold">{((result.duration_ms || 0) / 1000).toFixed(1)}s</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Confidence Score</p>
                  <p className="text-2xl font-bold">{result.metadata.confidence_score || 0}%</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Agents Used</p>
                  <p className="text-2xl font-bold">{result.metadata.agents_used?.length || 0}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}