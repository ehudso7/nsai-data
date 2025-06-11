import { Header } from '@/components/Header'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">About NSAI Data</h1>
          
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="text-gray-700 mb-6">
              NSAI Data is revolutionizing how businesses and researchers access and analyze information. 
              We believe that comprehensive research should be instant, accurate, and accessible to everyone.
            </p>
            <p className="text-gray-700">
              Our AI-powered platform transforms complex research queries into actionable insights in seconds, 
              not hours or days. By leveraging cutting-edge artificial intelligence and multi-agent systems, 
              we're making enterprise-grade research capabilities available to organizations of all sizes.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Our Technology</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">Multi-Agent AI System</h3>
                <p className="text-gray-700">
                  Six specialized AI agents work in harmony to analyze, search, extract, synthesize, 
                  format, and validate research data from across the web.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">Real-Time Processing</h3>
                <p className="text-gray-700">
                  Our distributed infrastructure processes queries in parallel, delivering comprehensive 
                  research reports in under 5 seconds on average.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">Fact Verification</h3>
                <p className="text-gray-700">
                  Built-in validation ensures all information is cross-referenced and fact-checked 
                  against multiple authoritative sources.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">Continuous Learning</h3>
                <p className="text-gray-700">
                  Our AI models continuously improve through user feedback and new data, 
                  ensuring increasingly accurate and relevant results.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Our Team</h2>
            <p className="text-gray-700 mb-6">
              Founded by AI researchers and industry veterans, NSAI Data brings together expertise 
              in machine learning, distributed systems, and information retrieval. Our team is passionate 
              about making advanced research capabilities accessible to everyone.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4"></div>
                <h3 className="font-semibold">Dr. Sarah Chen</h3>
                <p className="text-gray-600">CEO & Co-Founder</p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4"></div>
                <h3 className="font-semibold">Michael Rodriguez</h3>
                <p className="text-gray-600">CTO & Co-Founder</p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4"></div>
                <h3 className="font-semibold">Emily Watson</h3>
                <p className="text-gray-600">Head of AI Research</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Get In Touch</h2>
            <p className="text-gray-700 mb-4">
              Have questions about our technology or want to learn more about enterprise solutions?
            </p>
            <div className="flex gap-4">
              <Link 
                href="/contact" 
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition"
              >
                Contact Us
              </Link>
              <Link 
                href="/careers" 
                className="border border-primary-600 text-primary-600 px-6 py-2 rounded-lg hover:bg-primary-50 transition"
              >
                Join Our Team
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}