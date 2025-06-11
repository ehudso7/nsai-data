// Input sanitization and validation utilities

/**
 * Sanitize HTML input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Check if running in demo mode
 */
export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === 'true'
}

/**
 * Get API base URL
 */
export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'https://api.nsaidata.com'
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

/**
 * Get password strength
 */
export function getPasswordStrength(password: string) {
  let score = 0
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  }
  
  // Calculate score
  if (checks.length) score++
  if (checks.uppercase) score++
  if (checks.lowercase) score++
  if (checks.number) score++
  if (checks.special) score++
  
  // Return strength assessment
  if (score === 0) {
    return { score: 0, label: 'Very Weak', color: 'text-red-600', bgColor: 'bg-red-600' }
  } else if (score <= 2) {
    return { score: 1, label: 'Weak', color: 'text-orange-600', bgColor: 'bg-orange-600' }
  } else if (score === 3) {
    return { score: 2, label: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-600' }
  } else if (score === 4) {
    return { score: 3, label: 'Good', color: 'text-green-600', bgColor: 'bg-green-600' }
  } else {
    return { score: 4, label: 'Strong', color: 'text-green-700', bgColor: 'bg-green-700' }
  }
}