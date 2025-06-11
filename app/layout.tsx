import * as Sentry from '@sentry/nextjs'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'
import { Providers } from '@/components/Providers'

const inter = Inter({ subsets: ['latin'] })

export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL('https://nsaidata.com'),
    title: 'NSAI Data - Enterprise Autonomous Research Platform',
    description: 'Transform complex questions into comprehensive research reports in seconds with AI-powered autonomous agents.',
    keywords: 'AI research, autonomous agents, research platform, data analysis, NSAI',
    authors: [{ name: 'NSAI Data' }],
    openGraph: {
      title: 'NSAI Data - Enterprise Autonomous Research Platform',
      description: 'Transform complex questions into comprehensive research reports in seconds.',
      url: 'https://nsaidata.com',
      siteName: 'NSAI Data',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'NSAI Data',
      description: 'Enterprise Autonomous Research Platform',
    },
    other: {
      ...Sentry.getTraceData()
    }
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <GoogleAnalytics />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}