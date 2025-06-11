'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'

export function Header({ onLogoClick }: { onLogoClick?: () => void }) {
  const { data: session, status } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            {onLogoClick ? (
              <button
                onClick={onLogoClick}
                className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent"
              >
                NSAI Data
              </button>
            ) : (
              <Link
                href="/"
                className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent"
              >
                NSAI Data
              </Link>
            )}
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <a href="/#features" className="text-gray-700 hover:text-primary-600">Features</a>
            <a href="/#pricing" className="text-gray-700 hover:text-primary-600">Pricing</a>
            <Link href="/docs" className="text-gray-700 hover:text-primary-600">Docs</Link>
            <Link href="/api" className="text-gray-700 hover:text-primary-600">API</Link>
          </nav>
          
          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="text-gray-500">Loading...</div>
            ) : session ? (
              <>
                <Link href="/dashboard" className="text-gray-700 hover:text-primary-600">
                  Dashboard
                </Link>
                <button 
                  onClick={handleSignOut}
                  className="text-gray-700 hover:text-primary-600"
                >
                  Sign Out
                </button>
                <div className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                  {session.user.plan || 'FREE'}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-700 hover:text-primary-600">
                  Sign In
                </Link>
                <Link 
                  href="/register" 
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
          
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-primary-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-2">
              <a href="/#features" className="text-gray-700 hover:text-primary-600 py-2">Features</a>
              <a href="/#pricing" className="text-gray-700 hover:text-primary-600 py-2">Pricing</a>
              <Link href="/docs" className="text-gray-700 hover:text-primary-600 py-2">Docs</Link>
              <Link href="/api" className="text-gray-700 hover:text-primary-600 py-2">API</Link>
              
              <div className="pt-4 border-t">
                {session ? (
                  <>
                    <Link href="/dashboard" className="block text-gray-700 hover:text-primary-600 py-2">
                      Dashboard
                    </Link>
                    <button 
                      onClick={handleSignOut}
                      className="block w-full text-left text-gray-700 hover:text-primary-600 py-2"
                    >
                      Sign Out
                    </button>
                    <div className="mt-2 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium inline-block">
                      {session.user.plan || 'FREE'}
                    </div>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="block text-gray-700 hover:text-primary-600 py-2">
                      Sign In
                    </Link>
                    <Link 
                      href="/register" 
                      className="block bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-center mt-2"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}