import { z } from 'zod'

// Rate limiting configurations per plan
export const RATE_LIMITS = {
  FREE: { requests: 10, window: 60 * 60 * 1000 }, // 10 requests per hour
  STARTER: { requests: 50, window: 60 * 60 * 1000 }, // 50 requests per hour
  PROFESSIONAL: { requests: 200, window: 60 * 60 * 1000 }, // 200 requests per hour
  ENTERPRISE: { requests: 1000, window: 60 * 60 * 1000 }, // 1000 requests per hour
} as const

// Token limits per plan
export const TOKEN_LIMITS = {
  FREE: 50000, // 50k tokens per month
  STARTER: 500000, // 500k tokens per month
  PROFESSIONAL: 2000000, // 2M tokens per month
  ENTERPRISE: -1, // Unlimited
} as const

// Input validation schemas
export const QueryValidationSchema = z.object({
  query: z
    .string()
    .min(3, 'Query must be at least 3 characters')
    .max(1000, 'Query must not exceed 1000 characters')
    .refine(
      (val) => !containsMaliciousContent(val),
      'Query contains potentially malicious content'
    ),
  outputFormat: z.enum(['markdown', 'json', 'html']).default('markdown'),
  maxSources: z.number().min(1).max(50).default(10),
  includeRealTimeData: z.boolean().default(false),
  focusArea: z.enum(['general', 'technology', 'business', 'healthcare', 'finance']).default('general'),
  stream: z.boolean().default(false)
})

// Security: Check for malicious content in queries
export function containsMaliciousContent(input: string): boolean {
  const maliciousPatterns = [
    // Script injection attempts
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    
    // SQL injection patterns
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
    /(;|\|\||&&|\/\*|\*\/|--)/g,
    
    // Command injection
    /(\||\;|\&|\`|\$\(|\$\{)/g,
    
    // Path traversal
    /(\.\.\/|\.\.\\)/g,
    
    // XSS patterns
    /(<iframe|<object|<embed|<applet|<meta)/gi,
    
    // Prompt injection patterns for AI
    /(ignore\s+(previous|all)\s+(instructions?|prompts?|rules?))/gi,
    /(system\s*:?\s*(override|ignore|forget|disregard))/gi,
    /(jailbreak|prompt\s*injection|role\s*play\s*as)/gi
  ]
  
  return maliciousPatterns.some(pattern => pattern.test(input))
}

// Sanitize and normalize query input
export function sanitizeQuery(query: string): string {
  return query
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s\-.,!?()'"]/g, '') // Remove suspicious characters
    .substring(0, 1000) // Enforce length limit
}

// Rate limiting check
export function checkUserRateLimit(
  userPlan: string,
  userRequestCount: number,
  windowStart: Date
): { allowed: boolean; remaining: number; resetTime: Date } {
  const plan = userPlan.toUpperCase() as keyof typeof RATE_LIMITS
  const limits = RATE_LIMITS[plan] || RATE_LIMITS.FREE
  
  const now = new Date()
  const windowAge = now.getTime() - windowStart.getTime()
  
  // Reset window if expired
  if (windowAge >= limits.window) {
    return {
      allowed: true,
      remaining: limits.requests - 1,
      resetTime: new Date(now.getTime() + limits.window)
    }
  }
  
  const remaining = Math.max(0, limits.requests - userRequestCount)
  
  return {
    allowed: remaining > 0,
    remaining: remaining - 1,
    resetTime: new Date(windowStart.getTime() + limits.window)
  }
}

// Token usage validation
export function validateTokenUsage(
  userPlan: string,
  monthlyTokensUsed: number,
  requestTokens: number
): { allowed: boolean; limit: number; used: number } {
  const plan = userPlan.toUpperCase() as keyof typeof TOKEN_LIMITS
  const limit = TOKEN_LIMITS[plan] || TOKEN_LIMITS.FREE
  
  if (limit === -1) {
    return { allowed: true, limit: -1, used: monthlyTokensUsed }
  }
  
  return {
    allowed: monthlyTokensUsed + requestTokens <= limit,
    limit,
    used: monthlyTokensUsed
  }
}

// Log security events
export interface SecurityEvent {
  type: 'MALICIOUS_QUERY' | 'RATE_LIMIT_EXCEEDED' | 'TOKEN_LIMIT_EXCEEDED' | 'INVALID_INPUT'
  userId: string
  query?: string
  timestamp: Date
  metadata?: Record<string, any>
}

export function logSecurityEvent(event: SecurityEvent): void {
  // In production, send to security monitoring service
  console.warn('🚨 Security Event:', {
    type: event.type,
    userId: event.userId,
    timestamp: event.timestamp.toISOString(),
    metadata: event.metadata
  })
  
  // Redact sensitive query content for logging
  if (event.query) {
    const redactedQuery = event.query.length > 50 
      ? event.query.substring(0, 50) + '...[REDACTED]'
      : event.query
    console.warn('Query (redacted):', redactedQuery)
  }
}

// Content filtering for AI outputs
export function sanitizeAIOutput(content: string): string {
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframes
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/data:text\/html/gi, '') // Remove data URLs
    .trim()
}

// Request fingerprinting for abuse detection
export function generateRequestFingerprint(
  ip: string,
  userAgent: string,
  query: string
): string {
  const crypto = require('crypto')
  const data = `${ip}:${userAgent}:${query.substring(0, 100)}`
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16)
}

// Detect potential abuse patterns
export function detectAbusePatterns(
  recentQueries: string[],
  timestamps: Date[]
): { isAbusive: boolean; reasons: string[] } {
  const reasons: string[] = []
  
  // Check for repeated identical queries
  const uniqueQueries = new Set(recentQueries)
  if (recentQueries.length > 5 && uniqueQueries.size === 1) {
    reasons.push('Repeated identical queries detected')
  }
  
  // Check for rapid-fire requests
  const now = new Date()
  const recentRequests = timestamps.filter(t => 
    now.getTime() - t.getTime() < 60 * 1000 // Last minute
  )
  if (recentRequests.length > 10) {
    reasons.push('Excessive request frequency')
  }
  
  // Check for suspicious query patterns
  const suspiciousPatterns = recentQueries.some(query =>
    containsMaliciousContent(query) ||
    query.length > 800 ||
    /test|example|demo/gi.test(query)
  )
  if (suspiciousPatterns) {
    reasons.push('Suspicious query patterns')
  }
  
  return {
    isAbusive: reasons.length > 0,
    reasons
  }
}