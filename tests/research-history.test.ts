import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import ResearchHistoryPage from '@/app/dashboard/history/page'

// Mock next-auth
jest.mock('next-auth/react')

// Mock fetch
global.fetch = jest.fn()

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    if (formatStr === 'MMM dd, yyyy HH:mm') {
      return 'Dec 01, 2024 10:30'
    }
    return '2024-12-01'
  })
}))

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

describe('Research History Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock successful API response
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        history: [
          {
            id: 'query-1',
            query: 'Test research query about AI trends',
            status: 'COMPLETED',
            credits: 1,
            createdAt: '2024-12-01T10:30:00Z',
            updatedAt: '2024-12-01T10:32:00Z',
            result: { summary: 'Test result' }
          },
          {
            id: 'query-2',
            query: 'Market analysis for blockchain technology',
            status: 'FAILED',
            credits: 1,
            createdAt: '2024-12-01T09:15:00Z',
            updatedAt: '2024-12-01T09:15:30Z',
            result: null
          },
          {
            id: 'query-3',
            query: 'Healthcare innovation research',
            status: 'PROCESSING',
            credits: 1,
            createdAt: '2024-12-01T11:00:00Z',
            updatedAt: '2024-12-01T11:00:00Z',
            result: null
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          totalCount: 3,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      })
    })
  })

  describe('Authentication', () => {
    it('should show loading state while session is loading', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading'
      })

      render(React.createElement(ResearchHistoryPage))

      expect(screen.getByRole('generic')).toHaveClass('animate-spin')
    })

    it('should show access denied for unauthenticated users', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated'
      })

      render(React.createElement(ResearchHistoryPage))

      expect(screen.getByText('Access Denied')).toBeInTheDocument()
      expect(screen.getByText('Please sign in to view your research history.')).toBeInTheDocument()
    })

    it('should render history for authenticated users', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user-123',
            email: 'user@example.com'
          }
        },
        status: 'authenticated'
      })

      render(React.createElement(ResearchHistoryPage))

      await waitFor(() => {
        expect(screen.getByText('Research History')).toBeInTheDocument()
      })
    })
  })

  describe('History Display', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user-123',
            email: 'user@example.com'
          }
        },
        status: 'authenticated'
      })
    })

    it('should display research queries', async () => {
      render(React.createElement(ResearchHistoryPage))

      await waitFor(() => {
        expect(screen.getByText('Test research query about AI trends')).toBeInTheDocument()
        expect(screen.getByText('Market analysis for blockchain technology')).toBeInTheDocument()
        expect(screen.getByText('Healthcare innovation research')).toBeInTheDocument()
      })
    })

    it('should display query status with correct styling', async () => {
      render(React.createElement(ResearchHistoryPage))

      await waitFor(() => {
        expect(screen.getByText('COMPLETED')).toBeInTheDocument()
        expect(screen.getByText('FAILED')).toBeInTheDocument()
        expect(screen.getByText('PROCESSING')).toBeInTheDocument()
      })

      // Check status colors
      const completedStatus = screen.getByText('COMPLETED').closest('span')
      expect(completedStatus).toHaveClass('bg-green-100', 'text-green-800')

      const failedStatus = screen.getByText('FAILED').closest('span')
      expect(failedStatus).toHaveClass('bg-red-100', 'text-red-800')

      const processingStatus = screen.getByText('PROCESSING').closest('span')
      expect(processingStatus).toHaveClass('bg-blue-100', 'text-blue-800')
    })

    it('should display credits used', async () => {
      render(React.createElement(ResearchHistoryPage))

      await waitFor(() => {
        const creditElements = screen.getAllByText(/1 credit/)
        expect(creditElements).toHaveLength(3)
      })
    })

    it('should display formatted dates', async () => {
      render(React.createElement(ResearchHistoryPage))

      await waitFor(() => {
        const dateElements = screen.getAllByText('Created: Dec 01, 2024 10:30')
        expect(dateElements.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Filters and Search', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user-123',
            email: 'user@example.com'
          }
        },
        status: 'authenticated'
      })
    })

    it('should have search input', async () => {
      render(React.createElement(ResearchHistoryPage))

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search queries...')).toBeInTheDocument()
      })
    })

    it('should have status filter dropdown', async () => {
      render(React.createElement(ResearchHistoryPage))

      await waitFor(() => {
        const filterSelect = screen.getByRole('combobox')
        expect(filterSelect).toBeInTheDocument()
        expect(screen.getByDisplayValue('All Status')).toBeInTheDocument()
      })
    })

    it('should update search query', async () => {
      render(React.createElement(ResearchHistoryPage))

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search queries...')
        fireEvent.change(searchInput, { target: { value: 'AI trends' } })
        expect(searchInput).toHaveValue('AI trends')
      })
    })

    it('should update filter selection', async () => {
      render(React.createElement(ResearchHistoryPage))

      await waitFor(() => {
        const filterSelect = screen.getByRole('combobox')
        fireEvent.change(filterSelect, { target: { value: 'completed' } })
        expect(filterSelect).toHaveValue('completed')
      })
    })
  })

  describe('Export Functionality', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user-123',
            email: 'user@example.com'
          }
        },
        status: 'authenticated'
      })

      // Mock blob and URL methods
      global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
      global.URL.revokeObjectURL = jest.fn()
      
      // Mock document methods
      Object.defineProperty(document, 'createElement', {
        value: jest.fn(() => ({
          href: '',
          download: '',
          click: jest.fn(),
          style: {}
        }))
      })
      
      Object.defineProperty(document.body, 'appendChild', {
        value: jest.fn()
      })
      
      Object.defineProperty(document.body, 'removeChild', {
        value: jest.fn()
      })
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should have export buttons', async () => {
      render(React.createElement(ResearchHistoryPage))

      await waitFor(() => {
        expect(screen.getByText('Export JSON')).toBeInTheDocument()
        expect(screen.getByText('Export CSV')).toBeInTheDocument()
      })
    })

    it('should handle JSON export', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(['{"data": "test"}'], { type: 'application/json' }))
      })

      render(React.createElement(ResearchHistoryPage))

      await waitFor(() => {
        const exportButton = screen.getByText('Export JSON')
        fireEvent.click(exportButton)
      })

      // Verify fetch was called for export
      expect(global.fetch).toHaveBeenCalledWith('/api/user/history/export?format=json')
    })

    it('should handle export errors', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Export failed'))

      render(React.createElement(ResearchHistoryPage))

      await waitFor(() => {
        const exportButton = screen.getByText('Export CSV')
        fireEvent.click(exportButton)
      })

      await waitFor(() => {
        expect(screen.getByText(/Export failed/)).toBeInTheDocument()
      })
    })
  })

  describe('Action Buttons', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user-123',
            email: 'user@example.com'
          }
        },
        status: 'authenticated'
      })
    })

    it('should show View Result button for completed queries', async () => {
      render(React.createElement(ResearchHistoryPage))

      await waitFor(() => {
        expect(screen.getByText('View Result')).toBeInTheDocument()
      })
    })

    it('should show Retry button for failed queries', async () => {
      render(React.createElement(ResearchHistoryPage))

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument()
      })
    })

    it('should handle retry action', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })

      render(React.createElement(ResearchHistoryPage))

      await waitFor(() => {
        const retryButton = screen.getByText('Retry')
        fireEvent.click(retryButton)
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/user/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryId: 'query-2' })
      })
    })
  })

  describe('Empty State', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user-123',
            email: 'user@example.com'
          }
        },
        status: 'authenticated'
      })
    })

    it('should show empty state when no history', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          history: [],
          pagination: {
            page: 1,
            limit: 10,
            totalCount: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          }
        })
      })

      render(React.createElement(ResearchHistoryPage))

      await waitFor(() => {
        expect(screen.getByText('No research history found')).toBeInTheDocument()
        expect(screen.getByText('Start by making your first AI research query.')).toBeInTheDocument()
      })
    })

    it('should show filtered empty state', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          history: [],
          pagination: {
            page: 1,
            limit: 10,
            totalCount: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          }
        })
      })

      render(React.createElement(ResearchHistoryPage))

      // Set a filter
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search queries...')
        fireEvent.change(searchInput, { target: { value: 'nonexistent' } })
      })

      await waitFor(() => {
        expect(screen.getByText('No research history found')).toBeInTheDocument()
        expect(screen.getByText('Try adjusting your filters or search query.')).toBeInTheDocument()
      })
    })
  })

  describe('Pagination', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user-123',
            email: 'user@example.com'
          }
        },
        status: 'authenticated'
      })
    })

    it('should show pagination when multiple pages', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          history: [
            {
              id: 'query-1',
              query: 'Test query',
              status: 'COMPLETED',
              credits: 1,
              createdAt: '2024-12-01T10:30:00Z',
              updatedAt: '2024-12-01T10:32:00Z'
            }
          ],
          pagination: {
            page: 1,
            limit: 10,
            totalCount: 25,
            totalPages: 3,
            hasNext: true,
            hasPrev: false
          }
        })
      })

      render(React.createElement(ResearchHistoryPage))

      await waitFor(() => {
        expect(screen.getByText('Previous')).toBeInTheDocument()
        expect(screen.getByText('Next')).toBeInTheDocument()
        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
      })
    })

    it('should hide pagination for single page', async () => {
      render(React.createElement(ResearchHistoryPage))

      await waitFor(() => {
        expect(screen.queryByText('Previous')).not.toBeInTheDocument()
        expect(screen.queryByText('Next')).not.toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user-123',
            email: 'user@example.com'
          }
        },
        status: 'authenticated'
      })
    })

    it('should display error message when API fails', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Failed to fetch research history'))

      render(React.createElement(ResearchHistoryPage))

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch research history')).toBeInTheDocument()
      })
    })

    it('should display error for non-200 responses', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500
      })

      render(React.createElement(ResearchHistoryPage))

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch research history')).toBeInTheDocument()
      })
    })
  })

  describe('Loading States', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user-123',
            email: 'user@example.com'
          }
        },
        status: 'authenticated'
      })
    })

    it('should show loading spinner while fetching data', () => {
      // Mock a delayed response
      ;(global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      )

      render(React.createElement(ResearchHistoryPage))

      expect(screen.getByText('Loading research history...')).toBeInTheDocument()
      expect(screen.getByRole('generic')).toHaveClass('animate-spin')
    })
  })
})