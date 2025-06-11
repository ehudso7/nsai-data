import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    .optional(),
})

// GET user profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        plan: true,
        credits: true,
        apiKey: true,
        createdAt: true,
        _count: {
          select: {
            researchQueries: true,
            contactMessages: true,
          }
        }
      }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Get recent activity
    const recentQueries = await prisma.researchQuery.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        query: true,
        status: true,
        createdAt: true,
        credits: true,
      }
    })
    
    return NextResponse.json({
      user: {
        ...user,
        totalQueries: user._count.researchQueries,
        totalMessages: user._count.contactMessages,
      },
      recentActivity: recentQueries,
    })
    
  } catch (error) {
    console.error('User profile error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve profile' },
      { status: 500 }
    )
  }
}

// PATCH update user profile
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const validation = updateProfileSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }
    
    const { name, email, currentPassword, newPassword } = validation.data
    const updateData: any = {}
    
    if (name) updateData.name = name
    
    // Handle email change
    if (email && email !== session.user.email) {
      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })
      
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        )
      }
      
      updateData.email = email
    }
    
    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password required to set new password' },
          { status: 400 }
        )
      }
      
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { password: true }
      })
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
      
      const passwordValid = await bcrypt.compare(currentPassword, user.password)
      if (!passwordValid) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        )
      }
      
      updateData.password = await bcrypt.hash(newPassword, 12)
    }
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        plan: true,
        credits: true,
        apiKey: true,
      }
    })
    
    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser
    })
    
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}

// POST regenerate API key
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action !== 'regenerate-api-key') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }
    
    // Generate new API key
    const newApiKey = `sk_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`
    
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { apiKey: newApiKey },
      select: { apiKey: true }
    })
    
    return NextResponse.json({
      message: 'API key regenerated successfully',
      apiKey: updatedUser.apiKey
    })
    
  } catch (error) {
    console.error('API key regeneration error:', error)
    return NextResponse.json(
      { error: 'Failed to regenerate API key' },
      { status: 500 }
    )
  }
}