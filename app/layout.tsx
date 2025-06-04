import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}