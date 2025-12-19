import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isMember } from '@/lib/auth'
import { performOCR } from '@/lib/ocr'
import { z } from 'zod'

const ocrSchema = z.object({
  imageData: z.string().min(1, 'Image data is required'),
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

    // Check membership for OCR feature
    if (!isMember(session.user.role)) {
      return NextResponse.json(
        { error: 'Membership required for OCR scanning' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const validation = ocrSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { imageData } = validation.data

    // Perform OCR
    const result = await performOCR(imageData)

    return NextResponse.json(result)
  } catch (error) {
    console.error('OCR error:', error)
    return NextResponse.json(
      { error: 'OCR processing failed' },
      { status: 500 }
    )
  }
}
