/**
 * Embedding Pipeline Configuration
 *
 * Optimized for HVAC technical documentation with high accuracy requirements.
 * Using OpenAI text-embedding-3-small for cost-effective, accurate embeddings.
 */

export const EMBEDDING_CONFIG = {
  // Model settings
  model: 'text-embedding-3-small', // 1536 dimensions, good accuracy/cost ratio
  dimensions: 1536,

  // Chunking parameters - optimized for technical docs
  chunk: {
    maxTokens: 300,      // Smaller chunks for precise retrieval
    overlapTokens: 50,   // Overlap to maintain context
    minTokens: 50,       // Skip very small chunks
  },

  // Retrieval settings
  retrieval: {
    topK: 5,                    // Number of chunks to retrieve
    similarityThreshold: 0.75,  // Minimum similarity score (0-1)
    rerank: true,               // Enable re-ranking by document type
  },

  // Processing settings
  processing: {
    batchSize: 20,              // Chunks per API call
    maxConcurrent: 3,           // Concurrent API calls
    retryAttempts: 3,
    retryDelayMs: 1000,
  },
} as const

// Document type priority weights for re-ranking
// Higher weight = more relevant for that query type
export const DOC_TYPE_WEIGHTS: Record<string, Record<string, number>> = {
  decode: {
    DECODE_GUIDE: 2.0,
    TECH_BULLETIN: 1.5,
    SERVICE_MANUAL: 1.0,
    DEFAULT: 0.5,
  },
  specs: {
    SPEC_SHEET: 2.0,
    SERVICE_MANUAL: 1.5,
    INSTALLATION: 1.0,
    DEFAULT: 0.5,
  },
  troubleshoot: {
    SERVICE_MANUAL: 2.0,
    TECH_BULLETIN: 1.5,
    USER_MANUAL: 1.0,
    DEFAULT: 0.5,
  },
  install: {
    INSTALLATION: 2.0,
    USER_MANUAL: 1.5,
    SERVICE_MANUAL: 1.0,
    DEFAULT: 0.5,
  },
  general: {
    SERVICE_MANUAL: 1.2,
    SPEC_SHEET: 1.2,
    DECODE_GUIDE: 1.0,
    DEFAULT: 1.0,
  },
}

export type QueryIntent = keyof typeof DOC_TYPE_WEIGHTS
