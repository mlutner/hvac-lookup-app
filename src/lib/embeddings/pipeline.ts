/**
 * Document Embedding Pipeline
 *
 * Orchestrates the full embedding process:
 * 1. Fetch documents from Paperless-ngx
 * 2. Chunk documents into smaller pieces
 * 3. Generate embeddings via OpenRouter
 * 4. Store in PostgreSQL with pgvector
 *
 * Designed for high accuracy in HVAC technical documentation retrieval.
 */

import { PrismaClient } from '@prisma/client'
import { getDocument, getDocumentContent } from '@/lib/paperless/client'
import { chunkDocument, cleanContent } from './chunker'
import { generateEmbeddingsBatched } from './openai'
import { storeChunks, markDocumentEmbedded, deleteDocumentChunks } from './vectorStore'
import { EMBEDDING_CONFIG } from './config'

const prisma = new PrismaClient()

interface EmbeddingResult {
  documentId: string
  paperlessDocId: string
  title: string
  chunksCreated: number
  tokensProcessed: number
  success: boolean
  error?: string
}

interface PipelineProgress {
  total: number
  completed: number
  failed: number
  currentDocument?: string
}

type ProgressCallback = (progress: PipelineProgress) => void

/**
 * Process a single document through the embedding pipeline
 */
export async function embedDocument(
  documentId: string,
  options?: {
    forceReembed?: boolean
    onProgress?: (stage: string, progress: number) => void
  }
): Promise<EmbeddingResult> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      paperlessDocId: true,
      title: true,
      isEmbedded: true,
    },
  })

  if (!doc) {
    return {
      documentId,
      paperlessDocId: '',
      title: 'Unknown',
      chunksCreated: 0,
      tokensProcessed: 0,
      success: false,
      error: 'Document not found in database',
    }
  }

  // Skip if already embedded (unless force flag)
  if (doc.isEmbedded && !options?.forceReembed) {
    return {
      documentId,
      paperlessDocId: doc.paperlessDocId,
      title: doc.title,
      chunksCreated: 0,
      tokensProcessed: 0,
      success: true,
      error: 'Already embedded (skipped)',
    }
  }

  try {
    options?.onProgress?.('Fetching content', 0)

    // Fetch content from Paperless
    const paperlessId = parseInt(doc.paperlessDocId, 10)
    const content = await getDocumentContent(paperlessId)

    if (!content || content.trim().length === 0) {
      return {
        documentId,
        paperlessDocId: doc.paperlessDocId,
        title: doc.title,
        chunksCreated: 0,
        tokensProcessed: 0,
        success: false,
        error: 'Document has no content',
      }
    }

    options?.onProgress?.('Chunking document', 20)

    // Clean and chunk content
    const cleanedContent = cleanContent(content)
    const chunks = chunkDocument(cleanedContent)

    if (chunks.length === 0) {
      return {
        documentId,
        paperlessDocId: doc.paperlessDocId,
        title: doc.title,
        chunksCreated: 0,
        tokensProcessed: 0,
        success: false,
        error: 'No chunks generated',
      }
    }

    options?.onProgress?.('Generating embeddings', 40)

    // Generate embeddings
    const chunkTexts = chunks.map((c) => c.content)
    const embeddings = await generateEmbeddingsBatched(chunkTexts, (completed, total) => {
      const progress = 40 + (completed / total) * 40 // 40-80%
      options?.onProgress?.('Generating embeddings', progress)
    })

    options?.onProgress?.('Storing vectors', 80)

    // Delete existing chunks if re-embedding
    if (options?.forceReembed) {
      await deleteDocumentChunks(documentId)
    }

    // Store chunks with embeddings
    const chunksWithEmbeddings = chunks.map((chunk, i) => ({
      documentId,
      chunkIndex: chunk.chunkIndex,
      pageNumber: chunk.pageNumber,
      content: chunk.content,
      tokenCount: chunk.tokenCount,
      embedding: embeddings[i],
    }))

    await storeChunks(chunksWithEmbeddings)

    // Mark document as embedded
    await markDocumentEmbedded(documentId)

    options?.onProgress?.('Complete', 100)

    const totalTokens = chunks.reduce((sum, c) => sum + c.tokenCount, 0)

    return {
      documentId,
      paperlessDocId: doc.paperlessDocId,
      title: doc.title,
      chunksCreated: chunks.length,
      tokensProcessed: totalTokens,
      success: true,
    }
  } catch (error) {
    console.error(`Error embedding document ${documentId}:`, error)
    return {
      documentId,
      paperlessDocId: doc.paperlessDocId,
      title: doc.title,
      chunksCreated: 0,
      tokensProcessed: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Process all unembedded documents
 */
export async function embedAllDocuments(
  options?: {
    forceReembed?: boolean
    concurrency?: number
    onProgress?: ProgressCallback
  }
): Promise<EmbeddingResult[]> {
  const concurrency = options?.concurrency ?? 1 // Sequential by default for stability
  const results: EmbeddingResult[] = []

  // Get documents to process
  const documents = await prisma.document.findMany({
    where: options?.forceReembed ? {} : { isEmbedded: false },
    select: { id: true, title: true },
  })

  const progress: PipelineProgress = {
    total: documents.length,
    completed: 0,
    failed: 0,
  }

  options?.onProgress?.(progress)

  // Process documents
  for (let i = 0; i < documents.length; i += concurrency) {
    const batch = documents.slice(i, i + concurrency)

    const batchPromises = batch.map(async (doc) => {
      progress.currentDocument = doc.title
      options?.onProgress?.(progress)

      const result = await embedDocument(doc.id, { forceReembed: options?.forceReembed })

      if (result.success) {
        progress.completed++
      } else {
        progress.failed++
      }

      options?.onProgress?.(progress)
      return result
    })

    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)
  }

  return results
}

/**
 * Sync documents from Paperless to our database, then embed them
 */
export async function syncAndEmbedFromPaperless(
  options?: {
    onProgress?: ProgressCallback
  }
): Promise<{
  synced: number
  embedded: EmbeddingResult[]
}> {
  // Import the Paperless client functions we need
  const { searchDocuments } = await import('@/lib/paperless/client')

  // Fetch all documents from Paperless
  let allPaperlessDocs: Array<{
    id: number
    title: string
    page_count: number
  }> = []

  let page = 1
  let hasMore = true

  while (hasMore) {
    const response = await searchDocuments('', { page, pageSize: 100 })
    allPaperlessDocs.push(
      ...response.results.map((d) => ({
        id: d.id,
        title: d.title,
        page_count: d.page_count,
      }))
    )
    hasMore = response.next !== null
    page++
  }

  // Sync to our database
  let synced = 0
  for (const paperlessDoc of allPaperlessDocs) {
    const existing = await prisma.document.findUnique({
      where: { paperlessDocId: paperlessDoc.id.toString() },
    })

    if (!existing) {
      await prisma.document.create({
        data: {
          paperlessDocId: paperlessDoc.id.toString(),
          title: paperlessDoc.title,
          pageCount: paperlessDoc.page_count,
        },
      })
      synced++
    }
  }

  // Embed all unembedded documents
  const embedded = await embedAllDocuments({ onProgress: options?.onProgress })

  return { synced, embedded }
}

/**
 * Get embedding pipeline statistics
 */
export async function getEmbeddingStats(): Promise<{
  totalDocuments: number
  embeddedDocuments: number
  totalChunks: number
  estimatedCost: string
}> {
  const [totalDocuments, embeddedDocuments, totalChunks, tokenStats] = await Promise.all([
    prisma.document.count(),
    prisma.document.count({ where: { isEmbedded: true } }),
    prisma.documentChunk.count(),
    prisma.documentChunk.aggregate({
      _sum: { tokenCount: true },
    }),
  ])

  const totalTokens = tokenStats._sum.tokenCount || 0
  // text-embedding-3-small: $0.02 per 1M tokens
  const estimatedCost = `$${((totalTokens / 1_000_000) * 0.02).toFixed(4)}`

  return {
    totalDocuments,
    embeddedDocuments,
    totalChunks,
    estimatedCost,
  }
}
