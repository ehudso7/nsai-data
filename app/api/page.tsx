import { Header } from '@/components/Header'

export default function APIPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">API Reference</h1>
          
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Base URL</h2>
            <div className="bg-gray-100 p-4 rounded-lg">
              <code className="text-lg">https://api.nsaidata.com/v1</code>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Authentication</h2>
            <p className="text-gray-600 mb-4">
              All API requests require authentication using your API key in the header:
            </p>
            <div className="bg-gray-900 text-white p-4 rounded-lg">
              <code>Authorization: Bearer YOUR_API_KEY</code>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Endpoints</h2>
            
            <div className="border-b pb-6 mb-6">
              <h3 className="text-xl font-semibold mb-2">POST /research</h3>
              <p className="text-gray-600 mb-4">Submit a research query</p>
              
              <h4 className="font-semibold mb-2">Request Body</h4>
              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <pre className="text-sm">{`{
  "query": "string",
  "max_sources": 10,
  "output_format": "markdown" | "json" | "html",
  "language": "en",
  "include_citations": true
}`}</pre>
              </div>

              <h4 className="font-semibold mb-2">Response</h4>
              <div className="bg-gray-100 p-4 rounded-lg">
                <pre className="text-sm">{`{
  "research_id": "string",
  "status": "completed",
  "report": "string",
  "sources": [...],
  "metadata": {
    "sources_analyzed": 15,
    "confidence_score": 92,
    "duration_ms": 3247
  }
}`}</pre>
              </div>
            </div>

            <div className="border-b pb-6 mb-6">
              <h3 className="text-xl font-semibold mb-2">GET /research/[id]</h3>
              <p className="text-gray-600 mb-4">Get research report by ID</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">GET /usage</h3>
              <p className="text-gray-600 mb-4">Get current usage statistics</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Rate Limits</h2>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Plan</th>
                  <th className="text-left py-2">Requests/Month</th>
                  <th className="text-left py-2">Rate Limit</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2">Free</td>
                  <td className="py-2">10</td>
                  <td className="py-2">1/minute</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Starter</td>
                  <td className="py-2">100</td>
                  <td className="py-2">10/minute</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Professional</td>
                  <td className="py-2">1,000</td>
                  <td className="py-2">60/minute</td>
                </tr>
                <tr>
                  <td className="py-2">Enterprise</td>
                  <td className="py-2">Unlimited</td>
                  <td className="py-2">Custom</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}