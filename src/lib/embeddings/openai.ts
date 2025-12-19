/**
 * Embeddings Client via OpenRouter
 *
 * Generates embeddings using OpenRouter's unified API.
 * Default model: OpenAI text-embedding-3-small (best cost/accuracy ratio)
 * Includes retry logic and batching for reliability.
 *
 * OpenRouter supports multiple embedding models:
 * - openai/text-embedding-3-small ($0.02/1M tokens, 1536 dims) - RECOMMENDED
 * - openai/text-embedding-3-large ($0.13/1M tokens, 3072 dims)
 * - qwen/qwen3-embedding-8b (best MTEB scores)
 * - google/gemini-embedding-001 ($0.15/1M tokens)
 */

import { EMBEDDING_CONFIG } from './config'

// Use OpenRouter's unified API endpoint
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/embeddings'

interface EmbeddingResponse {
  data: Array<{
    embedding: number[]
    index: number
  }>
  usage: {
    prompt_tokens: number
    total_tokens: number
  }
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const embeddings = await generateEmbeddings([text])
  return embeddings[0]
}

/**
 * Generate embeddings for multiple texts in a single API call
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  // Use OpenRouter API key (falls back to OpenAI key for backwards compatibility)
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is required for embeddings')
  }

  if (texts.length === 0) {
    return []
  }

  // Clean and truncate texts
  const cleanedTexts = texts.map((t) => truncateToTokenLimit(t, 8191)) // Model limit

  // OpenRouter model format: provider/model-name
  const model = EMBEDDING_CONFIG.model.includes('/')
    ? EMBEDDING_CONFIG.model
    : `openai/${EMBEDDING_CONFIG.model}`

  const response = await fetchWithRetry(
    OPENROUTER_API_URL,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
        'X-Title': 'HVAC Lookup Portal',
      },
      body: JSON.stringify({
        model,
        input: cleanedTexts,
      }),
    },
    EMBEDDING_CONFIG.processing.retryAttempts
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`)
  }

  const data: EmbeddingResponse = await response.json()

  // Sort by index to maintain order
  data.data.sort((a, b) => a.index - b.index)

  return data.data.map((d) => d.embedding)
}

/**
 * Generate embeddings in batches
 */
export async function generateEmbeddingsBatched(
  texts: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<number[][]> {
  const results: number[][] = []
  const batchSize = EMBEDDING_CONFIG.processing.batchSize

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    const batchEmbeddings = await generateEmbeddings(batch)
    results.push(...batchEmbeddings)

    if (onProgress) {
      onProgress(Math.min(i + batchSize, texts.length), texts.length)
    }

    // Small delay between batches to avoid rate limiting
    if (i + batchSize < texts.length) {
      await sleep(100)
    }
  }

  return results
}

/**
 * Fetch with exponential backoff retry
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number
): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)

      // Retry on rate limit or server errors
      if (response.status === 429 || response.status >= 500) {
        const retryAfter = response.headers.get('retry-after')
        const delay = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : EMBEDDING_CONFIG.processing.retryDelayMs * Math.pow(2, attempt)

        await sleep(delay)
        continue
      }

      return response
    } catch (error) {
      lastError = error as Error
      await sleep(EMBEDDING_CONFIG.processing.retryDelayMs * Math.pow(2, attempt))
    }
  }

  throw lastError || new Error('Max retries exceeded')
}

/**
 * Simple token estimation for truncation
 */
function truncateToTokenLimit(text: string, maxTokens: number): string {
  // Rough estimate: 4 characters per token
  const maxChars = maxTokens * 4
  if (text.length <= maxChars) {
    return text
  }
  return text.slice(0, maxChars)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
