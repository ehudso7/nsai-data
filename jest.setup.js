import '@testing-library/jest-dom'

// Mock environment variables for testing
process.env.OPENAI_API_KEY = 'test-openai-key'
process.env.NEXTAUTH_SECRET = 'test-nextauth-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.DATABASE_URL = 'postgresql://localhost/test_nsai_data'

// Mock fetch globally for tests
global.fetch = jest.fn()

// Suppress console warnings during tests
const originalWarn = console.warn
beforeAll(() => {
  console.warn = jest.fn()
})

afterAll(() => {
  console.warn = originalWarn
})