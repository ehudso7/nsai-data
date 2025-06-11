import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/auth-utils'
import { z } from 'zod'
import nodemailer from 'nodemailer'

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(1000, 'Message too long'),
})

// Create email transporter
function createTransporter() {
  // In production, use SendGrid or another email service
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    })
  }
  
  // For development, use ethereal email or log to console
  if (process.env.NODE_ENV === 'development') {
    // Return a mock transporter that logs to console
    return {
      sendMail: async (options: any) => {
        console.log('📧 Email would be sent:', options)
        return { messageId: 'dev-' + Date.now() }
      }
    }
  }
  
  throw new Error('No email configuration found')
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    
    // Rate limiting - 5 messages per hour per IP
    const rateLimit = await checkRateLimit(ip, '/api/contact', 5)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many messages. Please try again later.' },
        { status: 429 }
      )
    }
    
    const body = await request.json()
    
    // Validate input
    const validation = contactSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }
    
    const { name, email, subject, message } = validation.data
    
    // Get session if user is logged in
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || null
    
    // Save to database
    const contactMessage = await prisma.contactMessage.create({
      data: {
        name,
        email,
        subject,
        message,
        userId,
        status: 'NEW',
      }
    })
    
    // Send email notification
    try {
      const transporter = createTransporter()
      
      // Send notification to admin
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@nsaidata.com',
        to: process.env.ADMIN_EMAIL || 'admin@nsaidata.com',
        subject: `New Contact Form Submission: ${subject}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>From:</strong> ${name} (${email})</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
          <hr>
          <p><small>Message ID: ${contactMessage.id}</small></p>
          ${userId ? `<p><small>User ID: ${userId}</small></p>` : ''}
        `,
      })
      
      // Send confirmation to user
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@nsaidata.com',
        to: email,
        subject: 'We received your message - NSAI Data',
        html: `
          <h2>Thank you for contacting NSAI Data</h2>
          <p>Hi ${name},</p>
          <p>We've received your message and will get back to you within 24-48 hours.</p>
          <p><strong>Your message:</strong></p>
          <blockquote style="border-left: 3px solid #ccc; padding-left: 10px; margin-left: 0;">
            <p><strong>Subject:</strong> ${subject}</p>
            <p>${message.replace(/\n/g, '<br>')}</p>
          </blockquote>
          <p>Best regards,<br>The NSAI Data Team</p>
          <hr>
          <p><small>This is an automated response. Please do not reply to this email.</small></p>
        `,
      })
    } catch (emailError) {
      console.error('Email sending failed:', emailError)
      // Don't fail the request if email fails - message is saved in DB
    }
    
    return NextResponse.json({
      message: 'Thank you for your message. We\'ll get back to you soon!',
      id: contactMessage.id,
    }, { status: 201 })
    
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to send message. Please try again.' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve contact messages (admin only)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    const where = status ? { status: status.toUpperCase() as any } : {}
    
    const [messages, total] = await Promise.all([
      prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            }
          }
        }
      }),
      prisma.contactMessage.count({ where })
    ])
    
    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    })
    
  } catch (error) {
    console.error('Contact messages GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH endpoint to update message status (admin only)
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const { id, status } = body
    
    if (!id || !status) {
      return NextResponse.json(
        { error: 'Message ID and status required' },
        { status: 400 }
      )
    }
    
    const validStatuses = ['NEW', 'IN_PROGRESS', 'RESOLVED', 'SPAM']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }
    
    const updated = await prisma.contactMessage.update({
      where: { id },
      data: { status }
    })
    
    return NextResponse.json({ message: 'Status updated', contact: updated })
    
  } catch (error) {
    console.error('Contact status update error:', error)
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    )
  }
}