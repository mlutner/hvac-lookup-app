/**
 * Admin Embeddings API
 *
 * Manage the document embedding pipeline:
 * - GET: View embedding statistics
 * - POST: Trigger embedding for specific documents or all
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isAdmin } from '@/lib/auth'
import {
  getEmbeddingStats,
  embedDocument,
  embedAllDocuments,
  syncAndEmbedFromPaperless,
} from '@/lib/embeddings/pipeline'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !isAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const stats = await getEmbeddingStats()

    return NextResponse.json({
      stats,
      config: {
        model: 'openai/text-embedding-3-small',
        dimensions: 1536,
        chunkSize: 300,
        chunkOverlap: 50,
        similarityThreshold: 0.75,
      },
    })
  } catch (error) {
    console.error('Error getting embedding stats:', error)
    return NextResponse.json(
      { error: 'Failed to get embedding stats' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !isAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, documentId, forceReembed } = body

    switch (action) {
      case 'embed_one': {
        if (!documentId) {
          return NextResponse.json(
            { error: 'documentId required for embed_one action' },
            { status: 400 }
          )
        }

        const result = await embedDocument(documentId, { forceReembed })
        return NextResponse.json({ result })
      }

      case 'embed_all': {
        const results = await embedAllDocuments({
          forceReembed,
          onProgress: (progress) => {
            // In a real app, you'd use SSE or WebSockets for progress
            console.log(`Embedding progress: ${progress.completed}/${progress.total}`)
          },
        })

        const summary = {
          total: results.length,
          successful: results.filter((r) => r.success).length,
          failed: results.filter((r) => !r.success).length,
          totalChunks: results.reduce((sum, r) => sum + r.chunksCreated, 0),
          totalTokens: results.reduce((sum, r) => sum + r.tokensProcessed, 0),
        }

        return NextResponse.json({ summary, results })
      }

      case 'sync_and_embed': {
        const { synced, embedded } = await syncAndEmbedFromPaperless()

        const summary = {
          newDocumentsImported: synced,
          total: embedded.length,
          successful: embedded.filter((r) => r.success).length,
          failed: embedded.filter((r) => !r.success).length,
          totalChunks: embedded.reduce((sum, r) => sum + r.chunksCreated, 0),
          totalTokens: embedded.reduce((sum, r) => sum + r.tokensProcessed, 0),
        }

        return NextResponse.json({ summary, results: embedded })
      }

      default:
        return NextResponse.json(
          {
            error: 'Invalid action. Use: embed_one, embed_all, or sync_and_embed',
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Embedding action error:', error)
    return NextResponse.json(
      {
        error: 'Embedding action failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
