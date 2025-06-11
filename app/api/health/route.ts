import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const checks: Record<string, any> = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV,
    checks: {}
  }
  
  // Database check
  try {
    const startTime = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const duration = Date.now() - startTime
    
    checks.checks.database = {
      status: 'healthy',
      responseTime: `${duration}ms`
    }
  } catch (error) {
    checks.status = 'unhealthy'
    checks.checks.database = {
      status: 'unhealthy',
      error: 'Database connection failed'
    }
  }
  
  // Memory usage
  const memoryUsage = process.memoryUsage()
  checks.checks.memory = {
    status: 'healthy',
    usage: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
    }
  }
  
  // Uptime
  checks.checks.uptime = {
    status: 'healthy',
    uptime: `${Math.round(process.uptime())}s`
  }
  
  const statusCode = checks.status === 'healthy' ? 200 : 503
  
  return NextResponse.json(checks, { status: statusCode })
}