'use client'

import { useState } from 'react'
import { ResearchInterface } from '@/components/ResearchInterface'
import { Header } from '@/components/Header'
import { Features } from '@/components/Features'
import { Pricing } from '@/components/Pricing'

export default function Home() {
  const [showApp, setShowApp] = useState(false)

  if (showApp) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onLogoClick={() => setShowApp(false)} />
        <main className="container mx-auto px-4 py-8">
          <ResearchInterface />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="gradient-bg text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Autonomous Research at Scale
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
            Transform complex questions into comprehensive research reports in seconds with AI-powered autonomous agents.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setShowApp(true)}
              className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Try It Now
            </button>
            <a
              href="#pricing"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition"
            >
              View Pricing
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <Features />

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Ask Your Question</h3>
              <p className="text-gray-600">
                Enter any research question or topic you want to explore
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Agents Work</h3>
              <p className="text-gray-600">
                Our 6 specialized agents analyze, search, extract, and synthesize
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Your Report</h3>
              <p className="text-gray-600">
                Receive a comprehensive, fact-checked research report in seconds
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <Pricing />

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">NSAI Data</h3>
              <p className="text-gray-400">
                Enterprise-grade autonomous research platform
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="/docs" className="hover:text-white">Documentation</a></li>
                <li><a href="/api" className="hover:text-white">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/about" className="hover:text-white">About</a></li>
                <li><a href="/blog" className="hover:text-white">Blog</a></li>
                <li><a href="/careers" className="hover:text-white">Careers</a></li>
                <li><a href="/contact" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/terms" className="hover:text-white">Terms of Service</a></li>
                <li><a href="/privacy" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="/security" className="hover:text-white">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 NSAI Data, Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}