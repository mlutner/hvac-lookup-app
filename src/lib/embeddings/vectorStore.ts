/**
 * Vector Store Operations
 *
 * Handles storage and retrieval of embeddings using pgvector.
 * Uses raw SQL for vector operations since Prisma doesn't natively support pgvector.
 */

import { PrismaClient } from '@prisma/client'
import { EMBEDDING_CONFIG, DOC_TYPE_WEIGHTS, QueryIntent } from './config'

const prisma = new PrismaClient()

interface ChunkWithEmbedding {
  documentId: string
  chunkIndex: number
  pageNumber?: number
  content: string
  tokenCount: number
  embedding: number[]
}

interface SearchResult {
  chunkId: string
  documentId: string
  paperlessDocId: string
  documentTitle: string
  documentTypeCode: string | null
  content: string
  pageNumber: number | null
  similarity: number
  adjustedScore: number
}

/**
 * Store chunks with embeddings in the database
 */
export async function storeChunks(chunks: ChunkWithEmbedding[]): Promise<void> {
  // Use a transaction to ensure all chunks are stored
  await prisma.$transaction(async (tx) => {
    for (const chunk of chunks) {
      // First, insert the chunk without embedding (Prisma handles this)
      const created = await tx.documentChunk.create({
        data: {
          documentId: chunk.documentId,
          chunkIndex: chunk.chunkIndex,
          pageNumber: chunk.pageNumber,
          content: chunk.content,
          tokenCount: chunk.tokenCount,
          embeddingModel: EMBEDDING_CONFIG.model,
        },
      })

      // Then update with embedding using raw SQL
      const embeddingStr = `[${chunk.embedding.join(',')}]`
      await tx.$executeRaw`
        UPDATE "DocumentChunk"
        SET embedding = ${embeddingStr}::vector
        WHERE id = ${created.id}
      `
    }
  })
}

/**
 * Search for similar chunks using vector similarity
 */
export async function searchSimilar(
  queryEmbedding: number[],
  options?: {
    topK?: number
    threshold?: number
    intent?: QueryIntent
    brandId?: string
    documentTypeCode?: string
  }
): Promise<SearchResult[]> {
  const topK = options?.topK ?? EMBEDDING_CONFIG.retrieval.topK
  const threshold = options?.threshold ?? EMBEDDING_CONFIG.retrieval.similarityThreshold
  const intent = options?.intent ?? 'general'

  const embeddingStr = `[${queryEmbedding.join(',')}]`

  // Build the query with optional filters
  let query = `
    SELECT
      dc.id as "chunkId",
      dc."documentId",
      d."paperlessDocId",
      d.title as "documentTitle",
      dt.code as "documentTypeCode",
      dc.content,
      dc."pageNumber",
      1 - (dc.embedding <=> ${embeddingStr}::vector) as similarity
    FROM "DocumentChunk" dc
    JOIN "Document" d ON dc."documentId" = d.id
    LEFT JOIN "DocumentType" dt ON d."typeId" = dt.id
    WHERE 1 - (dc.embedding <=> ${embeddingStr}::vector) >= ${threshold}
  `

  // Add optional filters
  if (options?.brandId) {
    query += `
      AND EXISTS (
        SELECT 1 FROM "BrandDocument" bd
        WHERE bd."documentId" = d.id AND bd."brandId" = '${options.brandId}'
      )
    `
  }

  if (options?.documentTypeCode) {
    query += `
      AND dt.code = '${options.documentTypeCode}'
    `
  }

  query += `
    ORDER BY similarity DESC
    LIMIT ${topK * 2}
  `

  // Execute raw query
  const results: Array<{
    chunkId: string
    documentId: string
    paperlessDocId: string
    documentTitle: string
    documentTypeCode: string | null
    content: string
    pageNumber: number | null
    similarity: number
  }> = await prisma.$queryRawUnsafe(query)

  // Apply document type re-ranking if enabled
  if (EMBEDDING_CONFIG.retrieval.rerank) {
    const weights = DOC_TYPE_WEIGHTS[intent] || DOC_TYPE_WEIGHTS.general

    const reranked = results.map((r) => {
      const typeWeight = r.documentTypeCode
        ? weights[r.documentTypeCode] || weights.DEFAULT
        : weights.DEFAULT

      return {
        ...r,
        adjustedScore: r.similarity * typeWeight,
      }
    })

    // Sort by adjusted score and take top K
    reranked.sort((a, b) => b.adjustedScore - a.adjustedScore)
    return reranked.slice(0, topK)
  }

  return results.map((r) => ({ ...r, adjustedScore: r.similarity })).slice(0, topK)
}

/**
 * Delete all chunks for a document
 */
export async function deleteDocumentChunks(documentId: string): Promise<void> {
  await prisma.documentChunk.deleteMany({
    where: { documentId },
  })
}

/**
 * Check if document has been embedded
 */
export async function isDocumentEmbedded(documentId: string): Promise<boolean> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { isEmbedded: true },
  })
  return doc?.isEmbedded ?? false
}

/**
 * Mark document as embedded
 */
export async function markDocumentEmbedded(documentId: string): Promise<void> {
  await prisma.document.update({
    where: { id: documentId },
    data: {
      isEmbedded: true,
      embeddedAt: new Date(),
    },
  })
}

/**
 * Get documents that need embedding
 */
export async function getUnembeddedDocuments(): Promise<
  Array<{ id: string; paperlessDocId: string; title: string }>
> {
  return prisma.document.findMany({
    where: { isEmbedded: false },
    select: { id: true, paperlessDocId: true, title: true },
  })
}

/**
 * Get embedding statistics
 */
export async function getEmbeddingStats(): Promise<{
  totalDocuments: number
  embeddedDocuments: number
  totalChunks: number
}> {
  const [totalDocuments, embeddedDocuments, totalChunks] = await Promise.all([
    prisma.document.count(),
    prisma.document.count({ where: { isEmbedded: true } }),
    prisma.documentChunk.count(),
  ])

  return { totalDocuments, embeddedDocuments, totalChunks }
}
