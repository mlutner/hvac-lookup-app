/**
 * Semantic Search API
 *
 * High-accuracy vector search using pgvector embeddings.
 * Returns results with similarity scores and citations.
 *
 * Accuracy features:
 * - Semantic understanding via embeddings
 * - Document type re-ranking by intent
 * - Similarity threshold filtering (0.75+)
 * - Page-level citations
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isMember } from '@/lib/auth'
import { generateEmbedding } from '@/lib/embeddings/openai'
import { searchSimilar } from '@/lib/embeddings/vectorStore'
import { EMBEDDING_CONFIG, QueryIntent } from '@/lib/embeddings/config'
import { getDocumentPreviewUrl } from '@/lib/paperless/client'

interface SemanticSearchResult {
  id: string
  documentId: string
  paperlessDocId: string
  title: string
  documentType: string | null
  excerpt: string
  pageNumber: number | null
  similarity: number
  adjustedScore: number
  previewUrl: string
  citation: {
    paperlessDocId: string
    pageStart: number
    pageEnd: number
    excerpt: string
  }
}

interface SemanticSearchResponse {
  query: string
  intent: QueryIntent
  results: SemanticSearchResult[]
  totalResults: number
  threshold: number
  processingTimeMs: number
}

// Intent detection patterns
const INTENT_PATTERNS: Record<QueryIntent, RegExp[]> = {
  decode: [
    /decode|serial|age|year|when|manufacture|how old/i,
  ],
  specs: [
    /spec|specification|btu|seer|afue|capacity|rating|efficiency/i,
  ],
  troubleshoot: [
    /error|fault|code|problem|issue|not working|troubleshoot|diagnose/i,
  ],
  install: [
    /install|setup|mount|connect|wire|duct/i,
  ],
  general: [], // Fallback
}

/**
 * Detect user intent from query
 */
function detectIntent(query: string): QueryIntent {
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(query)) {
        return intent as QueryIntent
      }
    }
  }
  return 'general'
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check membership
    if (!isMember(session.user.role)) {
      return NextResponse.json(
        { error: 'Membership required for semantic search' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const intentParam = searchParams.get('intent') as QueryIntent | null
    const topK = parseInt(searchParams.get('limit') || '5', 10)
    const threshold = parseFloat(
      searchParams.get('threshold') || String(EMBEDDING_CONFIG.retrieval.similarityThreshold)
    )
    const brandId = searchParams.get('brandId') || undefined
    const documentType = searchParams.get('documentType') || undefined

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      )
    }

    // Detect intent
    const intent = intentParam || detectIntent(query)

    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query)

    // Search for similar chunks
    const searchResults = await searchSimilar(queryEmbedding, {
      topK: Math.min(topK, 20), // Cap at 20
      threshold,
      intent,
      brandId,
      documentTypeCode: documentType,
    })

    // Format results with citations
    const results: SemanticSearchResult[] = searchResults.map((r) => ({
      id: r.chunkId,
      documentId: r.documentId,
      paperlessDocId: r.paperlessDocId,
      title: r.documentTitle,
      documentType: r.documentTypeCode,
      excerpt: r.content.slice(0, 500) + (r.content.length > 500 ? '...' : ''),
      pageNumber: r.pageNumber,
      similarity: Math.round(r.similarity * 1000) / 1000, // 3 decimal places
      adjustedScore: Math.round(r.adjustedScore * 1000) / 1000,
      previewUrl: getDocumentPreviewUrl(parseInt(r.paperlessDocId, 10)),
      citation: {
        paperlessDocId: r.paperlessDocId,
        pageStart: r.pageNumber || 1,
        pageEnd: r.pageNumber || 1,
        excerpt: r.content.slice(0, 200),
      },
    }))

    const response: SemanticSearchResponse = {
      query,
      intent,
      results,
      totalResults: results.length,
      threshold,
      processingTimeMs: Date.now() - startTime,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Semantic search error:', error)
    return NextResponse.json(
      {
        error: 'Semantic search failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // POST endpoint for more complex queries with body parameters
  const startTime = Date.now()

  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!isMember(session.user.role)) {
      return NextResponse.json(
        { error: 'Membership required for semantic search' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      query,
      intent: intentParam,
      limit = 5,
      threshold = EMBEDDING_CONFIG.retrieval.similarityThreshold,
      brandId,
      documentType,
      includeContext = false,
    } = body

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required in request body' },
        { status: 400 }
      )
    }

    const intent = intentParam || detectIntent(query)
    const queryEmbedding = await generateEmbedding(query)

    const searchResults = await searchSimilar(queryEmbedding, {
      topK: Math.min(limit, 20),
      threshold,
      intent,
      brandId,
      documentTypeCode: documentType,
    })

    const results: SemanticSearchResult[] = searchResults.map((r) => ({
      id: r.chunkId,
      documentId: r.documentId,
      paperlessDocId: r.paperlessDocId,
      title: r.documentTitle,
      documentType: r.documentTypeCode,
      excerpt: includeContext ? r.content : r.content.slice(0, 500) + (r.content.length > 500 ? '...' : ''),
      pageNumber: r.pageNumber,
      similarity: Math.round(r.similarity * 1000) / 1000,
      adjustedScore: Math.round(r.adjustedScore * 1000) / 1000,
      previewUrl: getDocumentPreviewUrl(parseInt(r.paperlessDocId, 10)),
      citation: {
        paperlessDocId: r.paperlessDocId,
        pageStart: r.pageNumber || 1,
        pageEnd: r.pageNumber || 1,
        excerpt: r.content.slice(0, 200),
      },
    }))

    return NextResponse.json({
      query,
      intent,
      results,
      totalResults: results.length,
      threshold,
      processingTimeMs: Date.now() - startTime,
    })
  } catch (error) {
    console.error('Semantic search error:', error)
    return NextResponse.json(
      {
        error: 'Semantic search failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
