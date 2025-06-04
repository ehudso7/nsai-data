'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

interface ResearchResponse {
  research_id: string
  status: string
  report?: string
  metadata?: any
  sources?: any[]
  duration_ms?: number
  error?: string
}

export function ResearchInterface() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ResearchResponse | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      // Demo mode - simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Mock response
      setResult({
        research_id: 'demo-' + Date.now(),
        status: 'completed',
        report: `# Research Report: ${query}

## Executive Summary

This is a demo research report for your query about "${query}". In the full version, NSAI Data's autonomous agents would:

1. **Analyze your query** to understand intent and develop search strategies
2. **Search the web** for the most relevant and authoritative sources
3. **Extract content** from discovered sources using advanced scraping
4. **Generate insights** by synthesizing information across sources
5. **Format a report** with clear structure and citations
6. **Validate findings** through fact-checking and cross-referencing

## Key Findings

- Advanced AI agents can process complex research queries in seconds
- Multi-agent systems provide more comprehensive results than single models
- Fact-checking and validation ensure high-quality, reliable outputs

## Sources

In a real report, this section would include:
- Academic papers and research publications
- Industry reports and whitepapers
- News articles and expert opinions
- Statistical data and case studies

## Conclusion

NSAI Data transforms how research is conducted by automating the entire process while maintaining quality and accuracy that rivals human researchers.

---
*This is a demo report. Sign up for an API key to access the full power of NSAI Data.*`,
        duration_ms: 3247,
        metadata: {
          sources_analyzed: 15,
          confidence_score: 92,
          agents_used: ['QueryAnalyzer', 'WebSearchAgent', 'ContentExtractor', 'InsightGenerator', 'ReportFormatter', 'ValidationAgent']
        }
      })
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

      {result && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Research Results</h2>
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                Download
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
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