import { Header } from '@/components/Header'
import Link from 'next/link'

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Documentation</h1>
          
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
            <p className="text-gray-600 mb-4">
              Welcome to NSAI Data documentation. Learn how to integrate our powerful research API into your applications.
            </p>
            
            <h3 className="text-xl font-semibold mb-3">Quick Start</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-6">
              <li>Sign up for an account</li>
              <li>Get your API key from the dashboard</li>
              <li>Install our SDK or make direct API calls</li>
              <li>Start making research queries</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3">Installation</h3>
            <div className="bg-gray-900 text-white p-4 rounded-lg mb-6">
              <code className="text-sm">
                # Python<br/>
                pip install nsai-data<br/><br/>
                # JavaScript<br/>
                npm install @nsai-data/client
              </code>
            </div>

            <h3 className="text-xl font-semibold mb-3">Basic Usage</h3>
            <div className="bg-gray-900 text-white p-4 rounded-lg">
              <pre className="text-sm overflow-x-auto">{`from nsai_data import Client

client = Client(api_key="your-api-key")
result = client.research(
    query="Latest AI developments",
    max_sources=20
)
print(result.report)`}</pre>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">API Reference</h2>
            <p className="text-gray-600 mb-4">
              For detailed API documentation, visit our{' '}
              <Link href="/api" className="text-primary-600 hover:underline">
                API reference page
              </Link>.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">SDKs & Libraries</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Python SDK</h3>
                <p className="text-gray-600">Full-featured Python client with async support</p>
              </div>
              <div>
                <h3 className="font-semibold">JavaScript SDK</h3>
                <p className="text-gray-600">TypeScript-ready SDK for Node.js and browsers</p>
              </div>
              <div>
                <h3 className="font-semibold">REST API</h3>
                <p className="text-gray-600">Direct HTTP endpoints for any language</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}