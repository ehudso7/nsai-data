import { render, screen, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import AdminUsageDashboard from '@/app/admin/usage/page'

// Mock next-auth
jest.mock('next-auth/react')

// Mock recharts components
jest.mock('recharts', () => ({
  BarChart: ({ children }: any) => React.createElement('div', { 'data-testid': 'bar-chart' }, children),
  Bar: () => React.createElement('div', { 'data-testid': 'bar' }),
  XAxis: () => React.createElement('div', { 'data-testid': 'x-axis' }),
  YAxis: () => React.createElement('div', { 'data-testid': 'y-axis' }),
  CartesianGrid: () => React.createElement('div', { 'data-testid': 'cartesian-grid' }),
  Tooltip: () => React.createElement('div', { 'data-testid': 'tooltip' }),
  ResponsiveContainer: ({ children }: any) => React.createElement('div', { 'data-testid': 'responsive-container' }, children),
  LineChart: ({ children }: any) => React.createElement('div', { 'data-testid': 'line-chart' }, children),
  Line: () => React.createElement('div', { 'data-testid': 'line' }),
  PieChart: ({ children }: any) => React.createElement('div', { 'data-testid': 'pie-chart' }, children),
  Pie: () => React.createElement('div', { 'data-testid': 'pie' }),
  Cell: () => React.createElement('div', { 'data-testid': 'cell' }),
  Area: () => React.createElement('div', { 'data-testid': 'area' }),
  AreaChart: ({ children }: any) => React.createElement('div', { 'data-testid': 'area-chart' }, children)
}))

import React from 'react'

// Mock fetch
global.fetch = jest.fn()

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

describe('Admin Usage Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock successful API responses
    ;(global.fetch as jest.Mock)
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          totalRequests: 1500,
          totalUsers: 42,
          avgDuration: 2500,
          totalCredits: 750,
          errorRate: 2.5,
          topEndpoints: [
            { endpoint: '/api/research', count: 1200 },
            { endpoint: '/api/user', count: 200 },
            { endpoint: '/api/contact', count: 100 }
          ],
          topUsers: [
            { userId: 'user-1', count: 150 },
            { userId: 'user-2', count: 100 },
            { userId: 'user-3', count: 75 }
          ]
        })
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          { date: 'Dec 01', requests: 100, users: 10, errors: 2, avgDuration: 1500 },
          { date: 'Dec 02', requests: 150, users: 15, errors: 1, avgDuration: 1800 },
          { date: 'Dec 03', requests: 200, users: 20, errors: 5, avgDuration: 2200 }
        ])
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          pending: 5,
          processing: 2,
          completed: 1500,
          failed: 25,
          deadLetter: 3
        })
      }))
  })

  describe('Authentication', () => {
    it('should show loading state while session is loading', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading'
      })

      render(React.createElement(AdminUsageDashboard))

      expect(screen.getByRole('generic')).toHaveClass('animate-spin')
    })

    it('should show access denied for unauthenticated users', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated'
      })

      render(React.createElement(AdminUsageDashboard))

      expect(screen.getByText('Access Denied')).toBeInTheDocument()
      expect(screen.getByText('Admin privileges required to view this dashboard.')).toBeInTheDocument()
    })

    it('should show access denied for non-admin users', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user-123',
            email: 'user@example.com',
            role: 'USER'
          }
        },
        status: 'authenticated'
      })

      render(React.createElement(AdminUsageDashboard))

      expect(screen.getByText('Access Denied')).toBeInTheDocument()
    })

    it('should render dashboard for admin users', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'admin-123',
            email: 'admin@example.com',
            role: 'ADMIN'
          }
        },
        status: 'authenticated'
      })

      render(React.createElement(AdminUsageDashboard))

      await waitFor(() => {
        expect(screen.getByText('Usage Analytics Dashboard')).toBeInTheDocument()
      })
    })
  })

  describe('Dashboard Content', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'admin-123',
            email: 'admin@example.com',
            role: 'ADMIN'
          }
        },
        status: 'authenticated'
      })
    })

    it('should display key metrics cards', async () => {
      render(React.createElement(AdminUsageDashboard))

      await waitFor(() => {
        expect(screen.getByText('Total Requests')).toBeInTheDocument()
        expect(screen.getByText('1,500')).toBeInTheDocument()
        expect(screen.getByText('Active Users')).toBeInTheDocument()
        expect(screen.getByText('42')).toBeInTheDocument()
        expect(screen.getByText('Avg Response Time')).toBeInTheDocument()
        expect(screen.getByText('2.5s')).toBeInTheDocument()
        expect(screen.getByText('Error Rate')).toBeInTheDocument()
        expect(screen.getByText('2.5%')).toBeInTheDocument()
      })
    })

    it('should display queue status', async () => {
      render(React.createElement(AdminUsageDashboard))

      await waitFor(() => {
        expect(screen.getByText('Job Queue Status')).toBeInTheDocument()
        expect(screen.getByText('5')).toBeInTheDocument() // pending
        expect(screen.getByText('2')).toBeInTheDocument() // processing
        expect(screen.getByText('25')).toBeInTheDocument() // failed
      })
    })

    it('should display charts', async () => {
      render(React.createElement(AdminUsageDashboard))

      await waitFor(() => {
        expect(screen.getByText('Requests Over Time')).toBeInTheDocument()
        expect(screen.getByText('Top Endpoints')).toBeInTheDocument()
        expect(screen.getByText('Response Time Trend')).toBeInTheDocument()
        expect(screen.getByText('Error Rate Trend')).toBeInTheDocument()
        expect(screen.getAllByTestId('responsive-container')).toHaveLength(4)
      })
    })

    it('should display top users table', async () => {
      render(React.createElement(AdminUsageDashboard))

      await waitFor(() => {
        expect(screen.getByText('Top Users by Activity')).toBeInTheDocument()
        expect(screen.getByText('User ID')).toBeInTheDocument()
        expect(screen.getByText('Requests')).toBeInTheDocument()
        expect(screen.getByText('150')).toBeInTheDocument()
        expect(screen.getByText('100')).toBeInTheDocument()
        expect(screen.getByText('75')).toBeInTheDocument()
      })
    })
  })

  describe('Controls', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'admin-123',
            email: 'admin@example.com',
            role: 'ADMIN'
          }
        },
        status: 'authenticated'
      })
    })

    it('should have timeframe selector', async () => {
      render(React.createElement(AdminUsageDashboard))

      await waitFor(() => {
        const select = screen.getByRole('combobox')
        expect(select).toBeInTheDocument()
        expect(screen.getByDisplayValue('Last 7 Days')).toBeInTheDocument()
      })
    })

    it('should have refresh button', async () => {
      render(React.createElement(AdminUsageDashboard))

      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument()
      })
    })

    it('should have export buttons', async () => {
      render(React.createElement(AdminUsageDashboard))

      await waitFor(() => {
        expect(screen.getByText('Export JSON')).toBeInTheDocument()
        expect(screen.getByText('Export CSV')).toBeInTheDocument()
      })
    })

    it('should have auto-refresh toggle', async () => {
      render(React.createElement(AdminUsageDashboard))

      await waitFor(() => {
        expect(screen.getByText('Auto-refresh')).toBeInTheDocument()
        expect(screen.getByRole('checkbox')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'admin-123',
            email: 'admin@example.com',
            role: 'ADMIN'
          }
        },
        status: 'authenticated'
      })
    })

    it('should display error message when API fails', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'))

      render(React.createElement(AdminUsageDashboard))

      await waitFor(() => {
        expect(screen.getByText(/API Error/)).toBeInTheDocument()
      })
    })

    it('should display error for non-200 responses', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500
      })

      render(React.createElement(AdminUsageDashboard))

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch dashboard data/)).toBeInTheDocument()
      })
    })
  })

  describe('Real-time Features', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'admin-123',
            email: 'admin@example.com',
            role: 'ADMIN'
          }
        },
        status: 'authenticated'
      })

      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should auto-refresh when enabled', async () => {
      render(React.createElement(AdminUsageDashboard))

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Usage Analytics Dashboard')).toBeInTheDocument()
      })

      // Clear previous calls
      jest.clearAllMocks()

      // Advance timer by 30 seconds (auto-refresh interval)
      jest.advanceTimersByTime(30000)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
    })
  })

  describe('Data Export', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'admin-123',
            email: 'admin@example.com',
            role: 'ADMIN'
          }
        },
        status: 'authenticated'
      })

      // Mock blob and URL.createObjectURL
      global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
      global.URL.revokeObjectURL = jest.fn()
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should handle JSON export', async () => {
      ;(global.fetch as jest.Mock).mockImplementationOnce(() => Promise.resolve({
        ok: true,
        blob: () => Promise.resolve(new Blob(['{"data": "test"}'], { type: 'application/json' }))
      }))

      render(React.createElement(AdminUsageDashboard))

      await waitFor(() => {
        expect(screen.getByText('Export JSON')).toBeInTheDocument()
      })

      // Note: Full click testing would require more complex setup
      // This test validates the component renders the export button
    })

    it('should handle CSV export', async () => {
      ;(global.fetch as jest.Mock).mockImplementationOnce(() => Promise.resolve({
        ok: true,
        blob: () => Promise.resolve(new Blob(['data,test'], { type: 'text/csv' }))
      }))

      render(React.createElement(AdminUsageDashboard))

      await waitFor(() => {
        expect(screen.getByText('Export CSV')).toBeInTheDocument()
      })
    })
  })

  describe('Responsive Design', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'admin-123',
            email: 'admin@example.com',
            role: 'ADMIN'
          }
        },
        status: 'authenticated'
      })
    })

    it('should render responsive grid layouts', async () => {
      render(React.createElement(AdminUsageDashboard))

      await waitFor(() => {
        // Check for responsive grid classes
        const gridContainers = document.querySelectorAll('.grid')
        expect(gridContainers.length).toBeGreaterThan(0)
      })
    })
  })
})