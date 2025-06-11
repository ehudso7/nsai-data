import { useEffect, useCallback, useRef } from 'react'
import * as Sentry from '@sentry/nextjs'

interface PerformanceMetrics {
  fcp?: number // First Contentful Paint
  lcp?: number // Largest Contentful Paint  
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  ttfb?: number // Time to First Byte
  tti?: number // Time to Interactive
}

interface PerformanceMonitorOptions {
  enableLogging?: boolean
  enableSentry?: boolean
  sampleRate?: number
}

export function usePerformanceMonitor(
  componentName: string,
  options: PerformanceMonitorOptions = {}
) {
  const {
    enableLogging = process.env.NODE_ENV === 'development',
    enableSentry = true,
    sampleRate = 0.1 // 10% sampling
  } = options

  const metricsRef = useRef<PerformanceMetrics>({})
  const observerRef = useRef<PerformanceObserver | null>(null)
  const renderStartRef = useRef<number>(performance.now())

  // Measure render performance
  useEffect(() => {
    const renderTime = performance.now() - renderStartRef.current
    
    if (enableLogging) {
      console.log(`[Performance] ${componentName} rendered in ${renderTime.toFixed(2)}ms`)
    }

    // Sample performance metrics
    if (Math.random() < sampleRate && enableSentry) {
      Sentry.addBreadcrumb({
        category: 'performance',
        message: `${componentName} render`,
        level: 'info',
        data: { renderTime }
      })
    }
  }, [componentName, enableLogging, enableSentry, sampleRate])

  // Setup performance observer
  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return
    }

    try {
      // Observe Core Web Vitals
      observerRef.current = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            metricsRef.current.lcp = entry.startTime
          } else if (entry.entryType === 'first-input' && 'processingStart' in entry) {
            const firstInput = entry as any
            metricsRef.current.fid = firstInput.processingStart - firstInput.startTime
          } else if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            metricsRef.current.cls = (metricsRef.current.cls || 0) + (entry as any).value
          }
        }

        reportMetrics()
      })

      // Observe different performance entry types
      if (observerRef.current.observe) {
        observerRef.current.observe({ entryTypes: ['largest-contentful-paint'] })
        observerRef.current.observe({ entryTypes: ['first-input'] })
        observerRef.current.observe({ entryTypes: ['layout-shift'] })
      }

      // Get other metrics
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        metricsRef.current.ttfb = navigation.responseStart - navigation.requestStart
      }

      const paintEntries = performance.getEntriesByType('paint')
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint')
      if (fcpEntry) {
        metricsRef.current.fcp = fcpEntry.startTime
      }

    } catch (error) {
      console.error('Failed to setup performance observer:', error)
    }

    return () => {
      observerRef.current?.disconnect()
    }
  }, [])

  const reportMetrics = useCallback(() => {
    const metrics = metricsRef.current

    if (enableLogging) {
      console.log(`[Performance] ${componentName} metrics:`, metrics)
    }

    // Report to Sentry
    if (enableSentry && Math.random() < sampleRate) {
      // Report as custom metrics
      Sentry.captureMessage('Web Vitals', {
        level: 'info',
        tags: {
          component: componentName,
          route: window.location.pathname
        },
        extra: {
          fcp: metrics.fcp,
          lcp: metrics.lcp,
          fid: metrics.fid,
          cls: metrics.cls,
          ttfb: metrics.ttfb
        }
      })
    }

    // Check performance budgets
    checkPerformanceBudgets(metrics)
  }, [componentName, enableLogging, enableSentry, sampleRate])

  const checkPerformanceBudgets = (metrics: PerformanceMetrics) => {
    const budgets = {
      fcp: 1800, // 1.8s
      lcp: 2500, // 2.5s
      fid: 100, // 100ms
      cls: 0.1, // 0.1
      ttfb: 800 // 800ms
    }

    const violations: string[] = []

    Object.entries(budgets).forEach(([metric, budget]) => {
      const value = metrics[metric as keyof PerformanceMetrics]
      if (value !== undefined && value > budget) {
        violations.push(`${metric.toUpperCase()}: ${value.toFixed(2)} (budget: ${budget})`)
      }
    })

    if (violations.length > 0 && enableLogging) {
      console.warn(
        `[Performance] ${componentName} exceeded budgets:`,
        violations.join(', ')
      )
    }
  }

  // Measure user interactions
  const measureInteraction = useCallback((interactionName: string) => {
    const startTime = performance.now()

    return () => {
      const duration = performance.now() - startTime

      if (enableLogging) {
        console.log(
          `[Performance] ${componentName} - ${interactionName}: ${duration.toFixed(2)}ms`
        )
      }

      if (enableSentry && Math.random() < sampleRate) {
        Sentry.addBreadcrumb({
          category: 'user-interaction',
          message: `${componentName} - ${interactionName}`,
          level: 'info',
          data: { duration }
        })
      }
    }
  }, [componentName, enableLogging, enableSentry, sampleRate])

  // Measure async operations
  const measureAsync = useCallback(
    async <T,>(operationName: string, operation: () => Promise<T>): Promise<T> => {
      const startTime = performance.now()

      try {
        const result = await operation()
        const duration = performance.now() - startTime

        if (enableLogging) {
          console.log(
            `[Performance] ${componentName} - ${operationName}: ${duration.toFixed(2)}ms`
          )
        }

        if (enableSentry && Math.random() < sampleRate) {
          Sentry.addBreadcrumb({
            category: 'async-operation',
            message: `${componentName} - ${operationName}`,
            level: 'info',
            data: { duration, success: true }
          })
        }

        return result
      } catch (error) {
        const duration = performance.now() - startTime

        if (enableSentry) {
          Sentry.captureException(error, {
            tags: {
              component: componentName,
              operation: operationName
            },
            extra: { duration }
          })
        }

        throw error
      }
    },
    [componentName, enableLogging, enableSentry, sampleRate]
  )

  return {
    measureInteraction,
    measureAsync,
    reportMetrics
  }
}

// Performance optimization HOC
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return function PerformanceMonitoredComponent(props: P) {
    usePerformanceMonitor(componentName)
    return <Component {...props} />
  }
}