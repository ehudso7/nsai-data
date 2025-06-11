import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
})

export type RegisterInput = z.infer<typeof registerSchema>

export async function createUser(data: RegisterInput) {
  const hashedPassword = await bcrypt.hash(data.password, 12)
  
  try {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
      },
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
    
    return { success: true, user }
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: 'Email already exists' }
    }
    throw error
  }
}

export async function validateApiKey(apiKey: string) {
  const user = await prisma.user.findUnique({
    where: { apiKey },
    select: {
      id: true,
      email: true,
      credits: true,
      plan: true,
      role: true,
    }
  })
  
  return user
}

export async function checkRateLimit(identifier: string, endpoint: string, limit: number = 100) {
  const windowStart = new Date(Date.now() - 60 * 60 * 1000) // 1 hour window
  
  const rateLimit = await prisma.rateLimit.findFirst({
    where: {
      identifier,
      endpoint,
      windowStart: {
        gte: windowStart
      }
    }
  })
  
  if (!rateLimit) {
    await prisma.rateLimit.create({
      data: {
        identifier,
        endpoint,
        count: 1,
        windowStart: new Date()
      }
    })
    return { allowed: true, remaining: limit - 1 }
  }
  
  if (rateLimit.count >= limit) {
    return { allowed: false, remaining: 0 }
  }
  
  await prisma.rateLimit.update({
    where: { id: rateLimit.id },
    data: { count: { increment: 1 } }
  })
  
  return { allowed: true, remaining: limit - rateLimit.count - 1 }
}