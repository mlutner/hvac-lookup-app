/**
 * Embeddings Module
 *
 * High-accuracy RAG pipeline for HVAC technical documentation.
 *
 * Architecture:
 * - Paperless-ngx: Document storage and OCR
 * - OpenRouter: Embedding generation (text-embedding-3-small)
 * - PostgreSQL + pgvector: Vector storage and similarity search
 *
 * Target Accuracy:
 * - Serial decode: 99%+ (database-driven rules with verified examples)
 * - Document retrieval: 95%+ (semantic search with re-ranking)
 * - Answer accuracy: 98%+ (citations required, low temperature)
 */

// Configuration
export { EMBEDDING_CONFIG, DOC_TYPE_WEIGHTS } from './config'
export type { QueryIntent } from './config'

// Chunking
export { chunkDocument, cleanContent } from './chunker'

// Embedding generation
export { generateEmbedding, generateEmbeddings, generateEmbeddingsBatched } from './openai'

// Vector store operations
export {
  storeChunks,
  searchSimilar,
  deleteDocumentChunks,
  isDocumentEmbedded,
  markDocumentEmbedded,
  getUnembeddedDocuments,
  getEmbeddingStats as getVectorStats,
} from './vectorStore'

// Pipeline orchestration
export {
  embedDocument,
  embedAllDocuments,
  syncAndEmbedFromPaperless,
  getEmbeddingStats,
} from './pipeline'
