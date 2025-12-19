-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to DocumentChunk table after it's created
-- This is handled in the post-migration script since Prisma creates tables first
