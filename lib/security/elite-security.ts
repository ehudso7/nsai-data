import crypto from 'crypto'
import { headers } from 'next/headers'
import * as Sentry from '@sentry/nextjs'

// Elite security configuration
const SECURITY_CONFIG = {
  // Content Security Policy
  csp: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://js.stripe.com'],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'img-src': ["'self'", 'data:', 'https:', 'blob:'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'connect-src': ["'self'", 'https://api.stripe.com', 'wss://', 'https://*.supabase.co'],
    'frame-src': ["'self'", 'https://js.stripe.com', 'https://hooks.stripe.com'],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': []
  },
  
  // Security headers
  headers: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  },
  
  // Rate limiting
  rateLimits: {
    auth: { window: 900000, max: 5 }, // 5 attempts per 15 minutes
    api: { window: 60000, max: 100 }, // 100 requests per minute
    upload: { window: 3600000, max: 10 } // 10 uploads per hour
  }
}

// Generate CSP header string
export function generateCSP(): string {
  const csp = Object.entries(SECURITY_CONFIG.csp)
    .map(([directive, values]) => {
      if (values.length === 0) return directive
      return `${directive} ${values.join(' ')}`
    })
    .join('; ')
  
  return csp
}

// Apply security headers
export function applySecurityHeaders(response: Response): Response {
  const securityHeaders = {
    ...SECURITY_CONFIG.headers,
    'Content-Security-Policy': generateCSP()
  }
  
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  return response
}

// Advanced input sanitization
export function sanitizeInput(input: string, type: 'text' | 'email' | 'url' | 'sql' = 'text'): string {
  let sanitized = input.trim()
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '')
  
  // Type-specific sanitization
  switch (type) {
    case 'email':
      // Basic email validation and sanitization
      sanitized = sanitized.toLowerCase()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized)) {
        throw new Error('Invalid email format')
      }
      break
      
    case 'url':
      // URL validation
      try {
        const url = new URL(sanitized)
        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new Error('Invalid URL protocol')
        }
        sanitized = url.toString()
      } catch {
        throw new Error('Invalid URL format')
      }
      break
      
    case 'sql':
      // SQL injection prevention
      sanitized = sanitized.replace(/['";\\]/g, '')
      break
      
    default:
      // XSS prevention for general text
      sanitized = sanitized
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
  }
  
  return sanitized
}

// Advanced threat detection
export class ThreatDetector {
  private static patterns = {
    sqlInjection: [
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b[\s\S]*\b(from|where|table|database)\b)/gi,
      /(\b(or|and)\b[\s]*['"0-9]+=[\s]*['"0-9]+)/gi,
      /(\'[\s]*;[\s]*--)/gi
    ],
    xss: [
      /<script[^>]*>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi
    ],
    pathTraversal: [
      /\.\.\//g,
      /\.\.%2F/gi,
      /%2e%2e%2f/gi,
      /\.\.\\/g
    ],
    commandInjection: [
      /[;&|`][\s]*(?:ls|cat|rm|mv|cp|wget|curl|bash|sh|cmd|powershell)/gi,
      /\$\([^)]+\)/g,
      /`[^`]+`/g
    ]
  }
  
  static detect(input: string): { safe: boolean; threats: string[] } {
    const threats: string[] = []
    
    // Check each threat category
    Object.entries(this.patterns).forEach(([category, patterns]) => {
      patterns.forEach(pattern => {
        if (pattern.test(input)) {
          threats.push(category)
          return
        }
      })
    })
    
    // Check for suspicious patterns
    if (input.length > 10000) {
      threats.push('oversized_input')
    }
    
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(input)) {
      threats.push('control_characters')
    }
    
    return {
      safe: threats.length === 0,
      threats: Array.from(new Set(threats))
    }
  }
}

// Secure token generation
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('base64url')
}

// Hash sensitive data
export function hashData(data: string, salt?: string): string {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex')
  const hash = crypto
    .pbkdf2Sync(data, actualSalt, 100000, 64, 'sha512')
    .toString('hex')
  
  return salt ? hash : `${actualSalt}:${hash}`
}

// Verify hashed data
export function verifyHash(data: string, hashedData: string): boolean {
  const [salt, hash] = hashedData.split(':')
  const verifyHash = hashData(data, salt)
  
  // Timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(verifyHash)
  )
}

// IP-based security checks
export async function performSecurityChecks(request: Request): Promise<{
  passed: boolean
  reason?: string
  metadata?: Record<string, any>
}> {
  const ip = headers().get('x-forwarded-for') || headers().get('cf-connecting-ip') || 'unknown'
  const userAgent = headers().get('user-agent') || ''
  
  // Check for suspicious patterns
  if (!userAgent || userAgent.length < 10) {
    return { passed: false, reason: 'invalid_user_agent' }
  }
  
  // Check for known bad IPs (would use external service in production)
  const badIps = process.env.BLOCKED_IPS?.split(',') || []
  if (badIps.includes(ip)) {
    return { passed: false, reason: 'blocked_ip' }
  }
  
  // Check for bot patterns
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python-requests/i
  ]
  
  const isBot = botPatterns.some(pattern => pattern.test(userAgent))
  if (isBot && !userAgent.includes('Googlebot')) {
    return { 
      passed: false, 
      reason: 'suspected_bot',
      metadata: { userAgent }
    }
  }
  
  // Check request rate from IP (simplified)
  const requestKey = `security:requests:${ip}`
  // Would use Redis or similar for tracking
  
  return { passed: true }
}

// Encrypt sensitive data
export function encryptData(data: string, key?: string): string {
  const encryptionKey = key || process.env.ENCRYPTION_KEY!
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    Buffer.from(encryptionKey, 'hex'),
    iv
  )
  
  let encrypted = cipher.update(data, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
}

// Decrypt sensitive data
export function decryptData(encryptedData: string, key?: string): string {
  const encryptionKey = key || process.env.ENCRYPTION_KEY!
  const parts = encryptedData.split(':')
  
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format')
  }
  
  const iv = Buffer.from(parts[0], 'hex')
  const authTag = Buffer.from(parts[1], 'hex')
  const encrypted = parts[2]
  
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(encryptionKey, 'hex'),
    iv
  )
  
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

// Audit logging for security events
export function auditLog(event: {
  action: string
  userId?: string
  ip: string
  userAgent: string
  metadata?: Record<string, any>
  severity: 'info' | 'warning' | 'critical'
}) {
  const logEntry = {
    ...event,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  }
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[AUDIT]', logEntry)
  }
  
  // Send to Sentry for monitoring
  if (event.severity === 'critical') {
    Sentry.captureMessage(`Security Audit: ${event.action}`, {
      level: 'warning',
      tags: {
        security: true,
        action: event.action
      },
      extra: logEntry
    })
  }
  
  // Would also log to persistent storage (database, SIEM, etc.)
}

// CORS configuration
export function getCorsHeaders(origin?: string): HeadersInit {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
  
  if (!origin || !allowedOrigins.includes(origin)) {
    return {}
  }
  
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true'
  }
}