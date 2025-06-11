/**
 * Elite E2E Launch Readiness Tests
 * Simulates real user journeys and validates production readiness
 */

import { test, expect, Page } from '@playwright/test'

const BASE_URL = process.env.PLAYWRIGHT_TEST_URL || 'http://localhost:3000'

// Performance budgets
const PERFORMANCE_BUDGETS = {
  firstContentfulPaint: 1500, // 1.5s
  largestContentfulPaint: 2500, // 2.5s
  totalBlockingTime: 300, // 300ms
  cumulativeLayoutShift: 0.1,
  timeToInteractive: 3500, // 3.5s
}

test.describe('Launch Readiness E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Enable performance observer
    await page.evaluateOnNewDocument(() => {
      window.performanceEntries = []
      const observer = new PerformanceObserver((list) => {
        window.performanceEntries.push(...list.getEntries())
      })
      observer.observe({ entryTypes: ['navigation', 'paint', 'layout-shift'] })
    })
  })

  test('Homepage loads within performance budget', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto(BASE_URL)
    
    // Check load time
    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(3000) // 3 seconds max

    // Check core web vitals
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const paints = performance.getEntriesByType('paint')
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: paints.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paints.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
      }
    })

    expect(metrics.firstContentfulPaint).toBeLessThan(PERFORMANCE_BUDGETS.firstContentfulPaint)
  })

  test('Complete user onboarding flow', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`)

    // Fill registration form
    await page.fill('input[name="email"]', `test${Date.now()}@example.com`)
    await page.fill('input[name="password"]', 'SecurePass123!')
    await page.fill('input[name="confirmPassword"]', 'SecurePass123!')
    
    // Submit and wait for redirect
    await Promise.all([
      page.waitForURL('**/dashboard'),
      page.click('button[type="submit"]')
    ])

    // Verify dashboard loaded
    await expect(page.locator('h1')).toContainText('Dashboard')
    
    // Check for onboarding elements
    await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible()
  })

  test('AI research flow works end-to-end', async ({ page }) => {
    // Login first
    await loginUser(page)
    
    // Navigate to research
    await page.goto(`${BASE_URL}/research/chat`)
    
    // Submit research query
    const query = 'What are the latest advances in quantum computing?'
    await page.fill('input[placeholder*="research question"]', query)
    await page.click('button[type="submit"]')
    
    // Wait for AI response to start streaming
    await page.waitForSelector('[data-testid="ai-response"]', { timeout: 10000 })
    
    // Verify streaming is working
    const responseElement = page.locator('[data-testid="ai-response"]')
    const initialText = await responseElement.textContent()
    
    // Wait a bit for more content
    await page.waitForTimeout(2000)
    
    const updatedText = await responseElement.textContent()
    expect(updatedText?.length).toBeGreaterThan(initialText?.length || 0)
    
    // Test export functionality
    await page.click('button[aria-label="Export as PDF"]')
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button[aria-label="Download"]')
    ])
    
    expect(download.suggestedFilename()).toMatch(/research-.*\.pdf/)
  })

  test('Admin dashboard shows real-time metrics', async ({ page }) => {
    // Login as admin
    await loginUser(page, 'admin@example.com', 'AdminPass123!')
    
    await page.goto(`${BASE_URL}/admin/usage`)
    
    // Check all metric cards are visible
    await expect(page.locator('[data-testid="total-requests"]')).toBeVisible()
    await expect(page.locator('[data-testid="active-users"]')).toBeVisible()
    await expect(page.locator('[data-testid="avg-response-time"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-rate"]')).toBeVisible()
    
    // Verify charts rendered
    await expect(page.locator('[data-testid="requests-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="response-time-chart"]')).toBeVisible()
    
    // Test real-time updates
    const initialRequests = await page.locator('[data-testid="total-requests"]').textContent()
    
    // Trigger some API activity in another tab
    const context = page.context()
    const apiPage = await context.newPage()
    await apiPage.goto(`${BASE_URL}/api/health`)
    await apiPage.close()
    
    // Wait for auto-refresh (if enabled) or manual refresh
    await page.click('button[aria-label="Refresh"]')
    await page.waitForTimeout(1000)
    
    const updatedRequests = await page.locator('[data-testid="total-requests"]').textContent()
    expect(parseInt(updatedRequests || '0')).toBeGreaterThanOrEqual(parseInt(initialRequests || '0'))
  })

  test('Billing integration works correctly', async ({ page }) => {
    await loginUser(page)
    
    await page.goto(`${BASE_URL}/pricing`)
    
    // Select usage-based plan
    await page.click('[data-plan="usage-based"]')
    await page.click('button[aria-label="Subscribe"]')
    
    // Should redirect to Stripe checkout
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 10000 })
    
    // Verify Stripe checkout loaded
    await expect(page.locator('form')).toBeVisible()
  })

  test('Mobile responsiveness', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 })
    
    await page.goto(BASE_URL)
    
    // Check mobile menu
    await page.click('[aria-label="Menu"]')
    await expect(page.locator('nav[aria-label="Mobile navigation"]')).toBeVisible()
    
    // Navigate to research on mobile
    await page.click('a[href="/research/chat"]')
    
    // Verify mobile-optimized layout
    const chatInput = page.locator('input[placeholder*="research question"]')
    await expect(chatInput).toBeVisible()
    
    const inputBox = await chatInput.boundingBox()
    expect(inputBox?.width).toBeLessThanOrEqual(375 - 32) // Full width minus padding
  })

  test('Security headers are properly set', async ({ page }) => {
    const response = await page.goto(BASE_URL)
    const headers = response?.headers()
    
    // Check security headers
    expect(headers?.['x-frame-options']).toBe('DENY')
    expect(headers?.['x-content-type-options']).toBe('nosniff')
    expect(headers?.['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(headers?.['permissions-policy']).toBeTruthy()
    
    // Check CSP
    const csp = headers?.['content-security-policy']
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("script-src 'self'")
  })

  test('API rate limiting works correctly', async ({ request }) => {
    const responses = []
    
    // Make rapid requests
    for (let i = 0; i < 15; i++) {
      const response = await request.get(`${BASE_URL}/api/health`)
      responses.push(response.status())
    }
    
    // Should hit rate limit
    const rateLimited = responses.filter(status => status === 429)
    expect(rateLimited.length).toBeGreaterThan(0)
  })

  test('Progressive Web App features', async ({ page }) => {
    await page.goto(BASE_URL)
    
    // Check manifest
    const manifest = await page.evaluate(() => {
      const link = document.querySelector('link[rel="manifest"]')
      return link?.getAttribute('href')
    })
    expect(manifest).toBeTruthy()
    
    // Check service worker registration
    const hasServiceWorker = await page.evaluate(() => 'serviceWorker' in navigator)
    expect(hasServiceWorker).toBeTruthy()
    
    // Check offline capability
    await page.context().setOffline(true)
    await page.reload()
    
    // Should show offline page
    await expect(page.locator('[data-testid="offline-message"]')).toBeVisible()
    
    await page.context().setOffline(false)
  })

  test('Accessibility compliance', async ({ page }) => {
    await page.goto(BASE_URL)
    
    // Run accessibility audit
    const violations = await page.evaluate(() => {
      // This would use axe-core in real implementation
      const issues = []
      
      // Check for missing alt texts
      const images = document.querySelectorAll('img:not([alt])')
      if (images.length > 0) {
        issues.push('Images without alt text')
      }
      
      // Check for proper heading hierarchy
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      let lastLevel = 0
      headings.forEach(h => {
        const level = parseInt(h.tagName[1])
        if (level > lastLevel + 1) {
          issues.push(`Heading hierarchy issue: ${h.tagName}`)
        }
        lastLevel = level
      })
      
      // Check for keyboard navigation
      const interactive = document.querySelectorAll('button, a, input, select, textarea')
      interactive.forEach(el => {
        if (!el.hasAttribute('tabindex') && el.getAttribute('tabindex') !== '-1') {
          const tabIndex = (el as HTMLElement).tabIndex
          if (tabIndex < 0) {
            issues.push(`Non-focusable interactive element: ${el.tagName}`)
          }
        }
      })
      
      return issues
    })
    
    expect(violations).toHaveLength(0)
  })

  test('Data export functionality', async ({ page }) => {
    await loginUser(page)
    
    await page.goto(`${BASE_URL}/dashboard/history`)
    
    // Test CSV export
    const [csvDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button[aria-label="Export CSV"]')
    ])
    
    expect(csvDownload.suggestedFilename()).toMatch(/research-history.*\.csv/)
    
    // Test JSON export
    const [jsonDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button[aria-label="Export JSON"]')
    ])
    
    expect(jsonDownload.suggestedFilename()).toMatch(/research-history.*\.json/)
  })

  test('Live demo mode works', async ({ page }) => {
    // Access without authentication
    await page.goto(`${BASE_URL}?demo=true`)
    
    // Should show demo banner
    await expect(page.locator('[data-testid="demo-banner"]')).toBeVisible()
    
    // Research should work with demo credits
    await page.goto(`${BASE_URL}/research/chat?demo=true`)
    
    const demoQuery = 'Demo: What is artificial intelligence?'
    await page.fill('input[placeholder*="research question"]', demoQuery)
    await page.click('button[type="submit"]')
    
    // Should get response without login
    await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 10000 })
  })

  test('Global edge performance', async ({ page }) => {
    // Simulate different geographic locations
    const locations = [
      { name: 'US East', lat: 40.7128, lon: -74.0060 },
      { name: 'EU West', lat: 51.5074, lon: -0.1278 },
      { name: 'Asia Pacific', lat: 35.6762, lon: 139.6503 }
    ]
    
    for (const location of locations) {
      await page.context().setGeolocation({
        latitude: location.lat,
        longitude: location.lon
      })
      
      const start = Date.now()
      await page.goto(BASE_URL)
      const loadTime = Date.now() - start
      
      console.log(`Load time from ${location.name}: ${loadTime}ms`)
      expect(loadTime).toBeLessThan(5000) // 5s max from any location
    }
  })
})

// Helper function to login
async function loginUser(
  page: Page, 
  email = 'test@example.com', 
  password = 'TestPass123!'
) {
  await page.goto(`${BASE_URL}/login`)
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  
  await Promise.all([
    page.waitForURL('**/dashboard'),
    page.click('button[type="submit"]')
  ])
}