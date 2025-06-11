'use client'

import { useChat } from 'ai/react'
import { useState } from 'react'
import { Send, Download, FileText, Copy, Trash2 } from 'lucide-react'
import { generateResearchReport, downloadBlob } from '@/lib/export/reports'

export default function ResearchChat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, stop, reload } = useChat({ 
    api: '/api/research',
    onFinish: (message) => {
      // Auto-save completed research to history
      if (message.role === 'assistant') {
        saveToHistory(input, message.content)
      }
    }
  })
  
  const [exportFormat, setExportFormat] = useState<'pdf' | 'markdown' | 'json'>('pdf')

  const saveToHistory = async (query: string, result: string) => {
    try {
      await fetch('/api/user/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          result: { content: result, format: 'text' },
          status: 'completed'
        })
      })
    } catch (error) {
      console.error('Failed to save to history:', error)
    }
  }

  const handleExport = async (message: any) => {
    if (message.role !== 'assistant') return
    
    try {
      // Find the corresponding user message
      const messageIndex = messages.findIndex(m => m.id === message.id)
      const userMessage = messageIndex > 0 ? messages[messageIndex - 1] : null
      const query = userMessage?.content || 'Research Query'
      
      const blob = await generateResearchReport(query, message.content, exportFormat)
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `research-${timestamp}.${exportFormat === 'markdown' ? 'md' : exportFormat}`
      
      downloadBlob(blob, filename)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      // Could add a toast notification here
    })
  }

  const clearChat = () => {
    reload()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Research Chat</h1>
            <p className="text-gray-600">Interactive research assistant with real-time streaming</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Export Format Selector */}
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="pdf">PDF Export</option>
              <option value="markdown">Markdown Export</option>
              <option value="json">JSON Export</option>
            </select>
            
            {/* Clear Chat */}
            <button
              onClick={clearChat}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Start Your Research</h3>
                <p className="text-gray-600">Ask any question to begin your AI-powered research session</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-3xl rounded-lg p-4 ${
                      message.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="font-medium text-sm mb-2 opacity-75">
                            {message.role === 'user' ? 'You' : 'AI Assistant'}
                          </div>
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">
                            {message.content}
                          </div>
                        </div>
                        
                        {/* Message Actions */}
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => copyToClipboard(message.content)}
                            className={`p-1 rounded hover:bg-black/10 transition-colors ${
                              message.role === 'user' ? 'text-white' : 'text-gray-600'
                            }`}
                            title="Copy message"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          
                          {message.role === 'assistant' && (
                            <button
                              onClick={() => handleExport(message)}
                              className="p-1 rounded hover:bg-black/10 transition-colors text-gray-600"
                              title={`Export as ${exportFormat.toUpperCase()}`}
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-4 max-w-3xl">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-gray-600">AI is researching...</span>
                        <button
                          onClick={stop}
                          className="ml-4 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        >
                          Stop
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <form onSubmit={handleSubmit} className="flex gap-4">
            <div className="flex-1">
              <input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask your research question... (e.g., 'What are the latest trends in AI?')"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
              {isLoading ? 'Researching...' : 'Send'}
            </button>
          </form>
          
          <div className="mt-3 text-xs text-gray-500">
            💡 Pro tip: Be specific in your questions for better results. Each query uses 1 credit.
          </div>
        </div>

        {/* Usage Stats */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Powered by Claude 3 • Streaming responses • Auto-saved to history</p>
        </div>
      </div>
    </div>
  )
}