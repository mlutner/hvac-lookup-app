import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isMember } from '@/lib/auth'
import { processRAGChat, processChat } from '@/lib/chatbot'
import { z } from 'zod'

const chatSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  context: z.object({
    brand: z.string().optional(),
    serial: z.string().optional(),
    model: z.string().optional(),
  }).optional(),
  // Use RAG-enhanced chat (default) or legacy keyword search
  useRAG: z.boolean().optional().default(true),
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check membership for chat feature
    if (!isMember(session.user.role)) {
      return NextResponse.json(
        { error: 'Membership required for AI assistant' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const validation = chatSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { message, context, useRAG } = validation.data

    // Process the chat message with RAG (high accuracy) or legacy (fallback)
    if (useRAG) {
      const response = await processRAGChat(message, context)
      return NextResponse.json({
        ...response,
        accuracy: {
          confidence: response.confidence,
          method: 'rag_semantic_search',
          citationCount: response.citations.length,
        },
      })
    } else {
      // Legacy keyword-based search (lower accuracy)
      const response = await processChat(message, context)
      return NextResponse.json({
        ...response,
        accuracy: {
          confidence: 0.6, // Estimated accuracy for keyword search
          method: 'keyword_search',
          citationCount: response.citations.length,
        },
      })
    }
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      {
        message: 'An error occurred while processing your request.',
        citations: [],
        type: 'no_results',
        accuracy: {
          confidence: 0,
          method: 'error',
          citationCount: 0,
        },
      },
      { status: 500 }
    )
  }
}
