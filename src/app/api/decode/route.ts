import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { decodeSerial } from '@/lib/ruleEngine'
import { z } from 'zod'

const decodeSchema = z.object({
  brand: z.string().min(1, 'Brand is required'),
  serial: z.string().min(1, 'Serial number is required'),
  model: z.string().optional(),
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

    const validation = decodeSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { brand, serial, model } = validation.data

    // Decode the serial number
    const result = decodeSerial({
      brand: brand.trim(),
      serial: serial.trim().toUpperCase(),
      model: model?.trim().toUpperCase(),
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Decode error:', error)
    return NextResponse.json(
      { error: 'An error occurred during decoding' },
      { status: 500 }
    )
  }
}
