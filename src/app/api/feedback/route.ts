import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const feedbackSchema = z.object({
  type: z.enum(['ERROR_REPORT', 'NEW_INFO', 'ASSISTANCE_REQUEST']),
  payload: z.record(z.unknown()),
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

    const body = await request.json()

    const validation = feedbackSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { type, payload } = validation.data

    // Create feedback record
    const feedback = await prisma.feedback.create({
      data: {
        type,
        payloadJson: payload,
        createdById: session.user.id,
      },
    })

    return NextResponse.json({
      id: feedback.id,
      message: 'Feedback submitted successfully',
    })
  } catch (error) {
    console.error('Feedback error:', error)
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    )
  }
}
