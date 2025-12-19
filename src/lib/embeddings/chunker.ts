/**
 * Document Chunker
 *
 * Splits documents into overlapping chunks optimized for HVAC technical content.
 * Uses token-based chunking for consistent sizes with OpenAI embeddings.
 */

import { EMBEDDING_CONFIG } from './config'

interface Chunk {
  content: string
  tokenCount: number
  pageNumber?: number
  chunkIndex: number
}

// Simple token estimation (4 chars per token is a good approximation for English)
// For production, use tiktoken for exact counts
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Split text into sentences (simple heuristic)
 */
function splitIntoSentences(text: string): string[] {
  // Split on sentence boundaries while preserving the delimiter
  return text
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 0)
}

/**
 * Split document into chunks with overlap
 *
 * Strategy:
 * 1. Split by pages if page markers exist
 * 2. Split each page into sentences
 * 3. Combine sentences into chunks of target size
 * 4. Add overlap between chunks for context continuity
 */
export function chunkDocument(
  content: string,
  options?: {
    maxTokens?: number
    overlapTokens?: number
    minTokens?: number
  }
): Chunk[] {
  const config = {
    maxTokens: options?.maxTokens ?? EMBEDDING_CONFIG.chunk.maxTokens,
    overlapTokens: options?.overlapTokens ?? EMBEDDING_CONFIG.chunk.overlapTokens,
    minTokens: options?.minTokens ?? EMBEDDING_CONFIG.chunk.minTokens,
  }

  const chunks: Chunk[] = []
  let chunkIndex = 0

  // Try to detect page breaks (common patterns in OCR'd PDFs)
  const pagePattern = /(?:^|\n)(?:Page|PAGE|\[Page\]|---\s*Page)\s*(\d+)/gi
  const pages = splitByPages(content, pagePattern)

  for (const page of pages) {
    const pageChunks = chunkPage(page.content, page.pageNumber, config)

    for (const chunk of pageChunks) {
      if (chunk.tokenCount >= config.minTokens) {
        chunks.push({
          ...chunk,
          chunkIndex: chunkIndex++,
        })
      }
    }
  }

  // If no chunks were created (very short document), create one chunk
  if (chunks.length === 0 && content.trim().length > 0) {
    chunks.push({
      content: content.trim(),
      tokenCount: estimateTokens(content.trim()),
      chunkIndex: 0,
    })
  }

  return chunks
}

/**
 * Split content by page markers
 */
function splitByPages(
  content: string,
  pagePattern: RegExp
): Array<{ content: string; pageNumber?: number }> {
  const pages: Array<{ content: string; pageNumber?: number }> = []

  // Find all page markers
  const matches: Array<{ index: number; pageNum: number }> = []
  let match
  while ((match = pagePattern.exec(content)) !== null) {
    matches.push({
      index: match.index,
      pageNum: parseInt(match[1], 10),
    })
  }

  if (matches.length === 0) {
    // No page markers found, treat as single page
    return [{ content }]
  }

  // Extract content between page markers
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index
    const end = i + 1 < matches.length ? matches[i + 1].index : content.length

    const pageContent = content.slice(start, end).trim()
    if (pageContent) {
      pages.push({
        content: pageContent,
        pageNumber: matches[i].pageNum,
      })
    }
  }

  // Include content before first page marker
  if (matches[0].index > 0) {
    const beforeFirst = content.slice(0, matches[0].index).trim()
    if (beforeFirst) {
      pages.unshift({ content: beforeFirst, pageNumber: 1 })
    }
  }

  return pages
}

/**
 * Chunk a single page with overlap
 */
function chunkPage(
  content: string,
  pageNumber: number | undefined,
  config: { maxTokens: number; overlapTokens: number; minTokens: number }
): Omit<Chunk, 'chunkIndex'>[] {
  const sentences = splitIntoSentences(content)
  const chunks: Omit<Chunk, 'chunkIndex'>[] = []

  let currentChunk: string[] = []
  let currentTokens = 0

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i]
    const sentenceTokens = estimateTokens(sentence)

    // If adding this sentence would exceed max, save current chunk and start new
    if (currentTokens + sentenceTokens > config.maxTokens && currentChunk.length > 0) {
      // Save current chunk
      const chunkContent = currentChunk.join(' ')
      chunks.push({
        content: chunkContent,
        tokenCount: currentTokens,
        pageNumber,
      })

      // Start new chunk with overlap
      // Go back to include overlap tokens worth of sentences
      const overlapSentences: string[] = []
      let overlapTokens = 0
      for (let j = currentChunk.length - 1; j >= 0 && overlapTokens < config.overlapTokens; j--) {
        overlapSentences.unshift(currentChunk[j])
        overlapTokens += estimateTokens(currentChunk[j])
      }

      currentChunk = overlapSentences
      currentTokens = overlapTokens
    }

    // Add sentence to current chunk
    currentChunk.push(sentence)
    currentTokens += sentenceTokens
  }

  // Save final chunk
  if (currentChunk.length > 0) {
    const chunkContent = currentChunk.join(' ')
    chunks.push({
      content: chunkContent,
      tokenCount: currentTokens,
      pageNumber,
    })
  }

  return chunks
}

/**
 * Clean document content before chunking
 */
export function cleanContent(content: string): string {
  return content
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove excessive line breaks
    .replace(/\n{3,}/g, '\n\n')
    // Remove null characters
    .replace(/\0/g, '')
    // Trim
    .trim()
}
