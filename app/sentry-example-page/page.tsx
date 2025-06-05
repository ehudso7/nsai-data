'use client'

import { useState } from 'react'

export default function SentryExamplePage() {
  const [isError, setIsError] = useState(false)

  const triggerError = () => {
    setIsError(true)
    throw new Error('This is a test error from NSAI Data!')
  }

  const triggerAsyncError = async () => {
    const response = await fetch('/api/sentry-test')
    if (!response.ok) {
      throw new Error('API test error')
    }
  }

  const triggerTypeError = () => {
    // @ts-ignore - Intentionally calling undefined function
    myUndefinedFunction()
  }

  if (isError) {
    throw new Error('React component error')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Sentry Test Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <p className="text-gray-600 mb-6">
            Click any button below to trigger a test error and verify Sentry is working correctly.
          </p>

          <div className="space-y-4">
            <button
              onClick={triggerError}
              className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
            >
              Trigger Error (Throw)
            </button>

            <button
              onClick={triggerTypeError}
              className="w-full bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition"
            >
              Trigger TypeError (Undefined Function)
            </button>

            <button
              onClick={triggerAsyncError}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
            >
              Trigger Async Error
            </button>
          </div>

          <div className="mt-8 p-4 bg-gray-100 rounded">
            <h2 className="font-semibold mb-2">After clicking a button:</h2>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
              <li>You should see an error in the browser</li>
              <li>The error will be sent to Sentry</li>
              <li>Check your Sentry dashboard for the error</li>
              <li>You can then remove this page from production</li>
            </ol>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a href="/" className="text-primary-600 hover:underline">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}