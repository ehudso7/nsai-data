import { z } from 'zod'
import { anthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ratelimit } from '@/lib/rate-limit'
import { logUsage, logSecurity, logPerformance } from '@/lib/logging'
import { prisma } from '@/lib/prisma'
import { sanitizeAIContent } from '@/lib/ai/research-agent'

const requestSchema = z.object({
  query: z.string().min(10, 'Query must be at least 10 characters').max(1000, 'Query too long'),
  outputFormat: z.enum(['text', 'json']).default('text'),
  sourceLimit: z.number().min(1).max(10).optional().default(5),
  focusArea: z.enum(['general', 'technology', 'business', 'healthcare', 'finance']).optional().default('general')
})

// Security: Check for malicious content in queries
function containsMaliciousContent(input: string): boolean {
  const maliciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /(ignore\s+(previous|all)\s+(instructions?|prompts?|rules?))/gi,
    /(system\s*:?\s*(override|ignore|forget|disregard))/gi,
    /(jailbreak|prompt\s*injection|role\s*play\s*as)/gi
  ]
  
  return maliciousPatterns.some(pattern => pattern.test(input))
}

// Build comprehensive research prompt based on query and parameters
function buildResearchPrompt(query: string, outputFormat: string, sourceLimit: number, focusArea: string): string {
  const focusInstructions = {
    technology: 'Focus on technical innovations, market trends, key players, and future developments.',
    business: 'Focus on market analysis, competitive landscape, financial metrics, and strategic insights.',
    healthcare: 'Focus on medical developments, clinical research, regulatory changes, and patient outcomes.',
    finance: 'Focus on market conditions, investment opportunities, risk factors, and economic indicators.',
    general: 'Provide comprehensive analysis across all relevant domains.'
  }

  const formatInstructions = outputFormat === 'json' 
    ? 'Format your response as valid JSON with fields: summary, key_findings, analysis, recommendations, sources.'
    : 'Format your response as clear, structured text with headers and bullet points.'

  return `You are an expert research analyst. Conduct comprehensive research on: "${query}"

## Research Parameters:
- Focus Area: ${focusArea}
- Target Sources: Up to ${sourceLimit} high-quality sources
- Output Format: ${outputFormat}

## Instructions:
${focusInstructions[focusArea as keyof typeof focusInstructions]}

${formatInstructions}

## Required Sections:
1. **Executive Summary** - Key findings and takeaways
2. **Current State Analysis** - Present situation with specific data
3. **Key Players & Stakeholders** - Major companies, organizations, or individuals
4. **Trends & Developments** - Recent changes and emerging patterns
5. **Challenges & Opportunities** - Obstacles and potential areas for growth
6. **Future Outlook** - Predictions and projections
7. **Strategic Recommendations** - Actionable advice and next steps

## Quality Standards:
- Include specific data points, statistics, and metrics where available
- Reference current developments (2024-2025)
- Provide actionable insights and concrete recommendations
- Maintain objectivity and cite realistic industry sources
- Ensure content is comprehensive yet accessible

Provide thorough, professional-grade research that delivers genuine value.`
}

export async function POST(req: Request) {
  const startTime = Date.now()
  
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const userId = session.user.id
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'

    // Rate limiting check
    const rateLimitResult = await ratelimit.check(userId, ip, 'ai_research')
    if (!rateLimitResult.allowed) {
      await logSecurity({
        type: 'rate_limit',
        userId,
        ip,
        endpoint: '/api/research',
        details: `Rate limit exceeded. Remaining: ${rateLimitResult.remaining}`,
        metadata: { limit: rateLimitResult.limit, reset: rateLimitResult.reset }
      })
      
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded',
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset.toISOString()
      }), { status: 429 })
    }

    // Input validation
    const body = await req.json()
    const result = requestSchema.safeParse(body)
    if (!result.success) {
      await logSecurity({
        type: 'invalid_input',
        userId,
        ip,
        endpoint: '/api/research',
        details: `Validation error: ${result.error.errors[0].message}`
      })
      
      return new Response(JSON.stringify({ error: result.error.errors[0].message }), { status: 400 })
    }

    const { query, outputFormat, sourceLimit, focusArea } = result.data

    // Security: Check for malicious content
    if (containsMaliciousContent(query)) {
      await logSecurity({
        type: 'malicious_content',
        userId,
        ip,
        endpoint: '/api/research',
        details: 'Malicious content detected in query',
        metadata: { queryLength: query.length }
      })
      
      return new Response(JSON.stringify({ error: 'Invalid query content' }), { status: 400 })
    }

    // Sanitize query
    const sanitizedQuery = sanitizeAIContent(query.trim())
    
    // Check user credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true, plan: true }
    })

    if (!user || user.credits < 1) {
      return new Response(JSON.stringify({ error: 'Insufficient credits' }), { status: 402 })
    }
    
    // Create research query record
    const researchQuery = await prisma.researchQuery.create({
      data: {
        userId,
        query: sanitizedQuery,
        status: 'PROCESSING',
      }
    })

    // Validate Anthropic API key
    if (!process.env.ANTHROPIC_API_KEY) {
      await logSecurity({
        type: 'unauthorized',
        userId,
        ip,
        endpoint: '/api/research',
        details: 'Missing Anthropic API key configuration'
      })
      
      return new Response(JSON.stringify({ error: 'AI service unavailable' }), { status: 503 })
    }
    
    try {
      // Generate Claude 3 research using streaming
      const researchPrompt = buildResearchPrompt(sanitizedQuery, outputFormat, sourceLimit, focusArea)
      
      const result = await streamText({
        model: anthropic('claude-3-opus-20240229'),
        messages: [
          {
            role: 'user',
            content: researchPrompt,
          },
        ],
        temperature: 0.3,
        maxTokens: 4000,
      })

      // Update research query status
      await prisma.researchQuery.update({
        where: { id: researchQuery.id },
        data: { status: 'PROCESSING' }
      })

      // Log usage for analytics
      const duration = Date.now() - startTime
      await logUsage({
        userId,
        endpoint: '/api/research',
        method: 'POST',
        query: sanitizedQuery,
        outputFormat,
        sourceLimit,
        ip,
        userAgent,
        timestamp: startTime,
        duration,
        statusCode: 200,
        credits: 1
      })

      // Log performance metrics
      await logPerformance({
        endpoint: '/api/research',
        userId,
        duration,
        tokensUsed: 4000, // Estimated max tokens
        metadata: {
          query: sanitizedQuery,
          outputFormat,
          focusArea,
          sourceLimit
        }
      })

      // Deduct credits
      await prisma.user.update({
        where: { id: userId },
        data: { credits: { decrement: 1 } }
      })

      return result.toDataStreamResponse()
      
      
    } catch (error) {
      const duration = Date.now() - startTime
      
      // Update query status to failed
      await prisma.researchQuery.update({
        where: { id: researchQuery.id },
        data: { status: 'FAILED' }
      })
      
      // Log error
      await logUsage({
        userId,
        endpoint: '/api/research',
        method: 'POST',
        query: sanitizedQuery,
        outputFormat,
        sourceLimit,
        ip,
        userAgent,
        timestamp: startTime,
        duration,
        statusCode: 500,
        credits: 0,
        error: (error as Error).message
      })
      
      console.error('Research API error:', error)
      return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
    }
    
  } catch (error) {
    console.error('Research API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
}

