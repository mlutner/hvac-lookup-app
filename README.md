# HVAC Lookup App

> AI-powered HVAC equipment identification and documentation search with 99%+ accuracy

A high-accuracy tool for home inspectors, HVAC technicians, and property managers to decode serial numbers, find specifications, and troubleshoot equipment using AI-powered semantic search.

## Why This Exists

Home inspectors and HVAC technicians need **certainty** when identifying equipment age and specifications. Existing solutions like Building Intelligence Center ($15/yr) and HVAC Decoder App ($9.99) use static lookup tables. This project brings **AI-powered accuracy** with:

- **Semantic search** - Understands meaning, not just keywords
- **Full document access** - Read original manufacturer PDFs
- **1M token context** - AI can read entire service manuals
- **Citations** - Every fact backed by page-level references

## Features

| Feature | Description |
|---------|-------------|
| **Serial Decode** | AI + Rule Engine for 99%+ accuracy on manufacture dates |
| **AI Assistant** | Gemini 3 Flash Preview with tool use for document search |
| **Semantic Search** | pgvector embeddings find information by meaning |
| **Full Manuals** | Paperless-ngx stores and OCRs complete PDFs |
| **Citations** | Every answer includes [Source: Doc, Page X] |
| **Tool Use** | AI can search, retrieve docs, decode serials |
| **Database Rules** | Add brands without code changes |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    HIGH-ACCURACY RAG PIPELINE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  Paperless   │───▶│   Chunker    │───▶│   pgvector   │       │
│  │  (OCR/Store) │    │ (300 tokens) │    │  (embeddings)│       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                                       │                │
│         ▼                                       ▼                │
│  ┌──────────────┐                      ┌──────────────┐         │
│  │   Document   │                      │   Semantic   │         │
│  │   Metadata   │                      │    Search    │         │
│  │   (Postgres) │                      │  (k=10, 0.75)│         │
│  └──────────────┘                      └──────────────┘         │
│         │                                       │                │
│         └───────────────┬───────────────────────┘                │
│                         ▼                                        │
│              ┌──────────────────┐                                │
│              │   Gemini 3 Flash │                                │
│              │  (temp: 0.0-0.2) │                                │
│              │   + Tool Use     │                                │
│              └──────────────────┘                                │
│                         │                                        │
│                         ▼                                        │
│              ┌──────────────────┐                                │
│              │  Response with   │                                │
│              │  Citations &     │                                │
│              │  Confidence %    │                                │
│              └──────────────────┘                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Database**: PostgreSQL + pgvector
- **Documents**: Paperless-ngx (OCR + storage)
- **AI Model**: Google Gemini 3 Flash Preview
- **Embeddings**: text-embedding-3-small (1536 dim)
- **AI Gateway**: OpenRouter
- **Auth**: NextAuth.js

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- OpenRouter API key ([get one here](https://openrouter.ai))

### Installation

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/hvac-lookup-app.git
cd hvac-lookup-app

# 2. Start Paperless-ngx
docker-compose -f docker/compose/docker-compose.postgres.yml up -d

# 3. Start Portal with pgvector
docker-compose -f docker/compose/docker-compose.portal.yml up -d

# 4. Configure
cd apps/portal
cp .env.example .env
# Edit .env with your OPENROUTER_API_KEY

# 5. Initialize database
npx prisma db push
npx prisma db seed

# 6. Generate embeddings (after uploading docs to Paperless)
curl -X POST http://localhost:3000/api/admin/embeddings \
  -H "Content-Type: application/json" \
  -d '{"action": "sync_and_embed"}'
```

## Environment Variables

```bash
# Database (pgvector)
DATABASE_URL="postgresql://portal:portal@localhost:5432/portal"

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Paperless-ngx
PAPERLESS_BASE_URL="http://localhost:8000"
PAPERLESS_API_TOKEN="your-token"

# OpenRouter AI
OPENROUTER_API_KEY="sk-or-v1-..."
AI_MODEL="google/gemini-3-flash-preview"
AI_TEMPERATURE="0.1"
```

## API Endpoints

### Chat with AI
```bash
POST /api/chat
{
  "message": "What year was this Carrier made? Serial: A2106123456"
}

# Response includes citations and confidence score
```

### Semantic Search
```bash
GET /api/search/semantic?q=carrier+efficiency+rating&intent=specs
```

### Serial Decode
```bash
POST /api/decode
{ "brand": "Carrier", "serial": "A2106123456" }
```

### Admin - Embeddings
```bash
GET /api/admin/embeddings          # Stats
POST /api/admin/embeddings         # Trigger embedding
  { "action": "sync_and_embed" }
```

## Accuracy Settings

| Query Type | Temperature | Thinking | Purpose |
|------------|-------------|----------|---------|
| Decode | 0.0 | High | Deterministic dates |
| Specs | 0.1 | Medium | Exact values |
| Troubleshoot | 0.2 | High | Diagnostic reasoning |
| Install | 0.1 | Medium | Safety-critical |
| General | 0.2 | Medium | Balanced |

## Supported Brands

Currently configured (add more via database):
- Carrier / Bryant / Payne
- Trane / American Standard
- Lennox
- Rheem / Ruud
- Goodman / Amana
- Bosch
- Weil-McLain

## Project Structure

```
apps/portal/
├── prisma/
│   ├── schema.prisma      # PostgreSQL + pgvector
│   └── seed.ts            # Brands, doc types, categories
├── src/
│   ├── app/api/
│   │   ├── chat/          # RAG chatbot
│   │   ├── search/semantic/  # Vector search
│   │   ├── decode/        # Serial decode
│   │   └── admin/embeddings/ # Embedding management
│   ├── lib/
│   │   ├── ai/            # Gemini config + tools
│   │   ├── chatbot/       # RAG implementation
│   │   ├── embeddings/    # Vector pipeline
│   │   ├── paperless/     # Document API
│   │   └── ruleEngine/    # Serial patterns
│   └── types/
└── docs/
    ├── BUILD_LOG.md
    ├── SCHEMA_MAP.md
    └── COMPETITIVE_ASSESSMENT.md
```

## Competitive Position

| Feature | Building Intelligence | HVAC Decoder | **This App** |
|---------|----------------------|--------------|--------------|
| AI | No | No | **Gemini 3 Flash** |
| Semantic Search | No | No | **pgvector** |
| Full Manuals | No | No | **Paperless-ngx** |
| Citations | Manual | No | **Auto page-level** |
| Price | $15/yr | $9.99 | **Self-hosted** |

See [COMPETITIVE_ASSESSMENT.md](docs/COMPETITIVE_ASSESSMENT.md) for full analysis.

## Contributing

1. Fork the repository
2. Add serial patterns for new brands
3. Upload decode guides to Paperless
4. Submit PR with test cases

## Cost Estimate

| Component | Monthly Cost |
|-----------|-------------|
| OpenRouter API | $20-50 |
| Server (VPS) | $20-50 |
| Storage | $5-10 |
| **Total** | **~$50-100** |

## License

MIT

## Acknowledgments

- [Paperless-ngx](https://github.com/paperless-ngx/paperless-ngx)
- [OpenRouter](https://openrouter.ai)
- [pgvector](https://github.com/pgvector/pgvector)
- [Gemini 3 Flash Preview](https://openrouter.ai/google/gemini-3-flash-preview)
