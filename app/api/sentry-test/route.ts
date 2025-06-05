import { NextResponse } from 'next/server'

export async function GET() {
  // This will trigger a server-side error for Sentry testing
  throw new Error('API test error from NSAI Data server!')
  
  // This line will never be reached
  return NextResponse.json({ message: 'This should not be returned' })
}