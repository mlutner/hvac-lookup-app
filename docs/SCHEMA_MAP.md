# HVAC Lookup Portal - Schema Map

## Visual Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              PRODUCT HIERARCHY                                   │
└─────────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────────┐
  │   MANUFACTURER   │  (Carrier Global, Trane Technologies, etc.)
  │──────────────────│
  │ id               │
  │ name             │
  │ website          │
  └────────┬─────────┘
           │ 1:N
           ▼
  ┌──────────────────┐
  │      BRAND       │  (Carrier, Bryant, Payne, Trane, American Standard)
  │──────────────────│
  │ id               │
  │ name             │
  │ slug             │
  │ manufacturerId   │───────────────────────────────────────────┐
  │ aliases (JSON)   │                                           │
  │ logoUrl          │                                           │
  └────────┬─────────┘                                           │
           │ 1:N                                                  │
           ▼                                                      │
  ┌──────────────────┐     ┌──────────────────┐                  │
  │   PRODUCT LINE   │     │ PRODUCT CATEGORY │                  │
  │──────────────────│     │──────────────────│                  │
  │ id               │     │ id               │                  │
  │ name             │◄────│ name (Furnaces)  │                  │
  │ brandId          │     │ slug             │                  │
  │ categoryId       │     │ parentId (self)  │◄──┐              │
  │ productionStart  │     │ path             │   │ Hierarchy    │
  │ productionEnd    │     │ level            │───┘              │
  └────────┬─────────┘     └──────────────────┘                  │
           │ 1:N                                                  │
           ▼                                                      │
  ┌──────────────────┐                                           │
  │      MODEL       │  (59MN7A100, XR15-024, etc.)              │
  │──────────────────│                                           │
  │ id               │                                           │
  │ modelNumber      │                                           │
  │ productLineId    │                                           │
  │ name             │                                           │
  │ specs (JSON)     │  ← BTU, SEER, AFUE, dimensions            │
  │ productionStart  │                                           │
  │ productionEnd    │                                           │
  └──────────────────┘                                           │
                                                                  │
                                                                  │
┌─────────────────────────────────────────────────────────────────│───────────────┐
│                          DOCUMENT SYSTEM                        │               │
└─────────────────────────────────────────────────────────────────│───────────────┘
                                                                  │
  ┌──────────────────┐     ┌──────────────────┐                  │
  │  DOCUMENT TYPE   │     │    DOCUMENT      │                  │
  │──────────────────│     │──────────────────│                  │
  │ id               │     │ id               │                  │
  │ code             │◄────│ paperlessDocId   │  ← Links to      │
  │ name             │     │ title            │    Paperless-ngx │
  │ description      │     │ typeId           │                  │
  │ priority         │     │ isOfficial       │                  │
  └──────────────────┘     │ reliability      │                  │
                           │ language         │                  │
   Document Types:         │ pageCount        │                  │
   ├─ DECODE_GUIDE         └────────┬─────────┘                  │
   ├─ SERVICE_MANUAL                │                            │
   ├─ SPEC_SHEET                    │ N:M (via junction tables)  │
   ├─ INSTALLATION                  │                            │
   ├─ WIRING_DIAGRAM               ┌┴──────────────────┐         │
   ├─ PARTS_LIST                   │                   │         │
   ├─ TECH_BULLETIN                ▼                   ▼         │
   └─ USER_MANUAL         ┌─────────────────┐ ┌─────────────────┐│
                          │ BrandDocument   │ │ProductLineDoc   ││
                          │─────────────────│ │─────────────────││
                          │ brandId ────────│►│ productLineId   ││
                          │ documentId      │ │ documentId      ││
                          │ relevance       │ │ relevance       ││
                          └─────────────────┘ └─────────────────┘│
                                                                  │
                                               ┌─────────────────┐│
                                               │  ModelDocument  ││
                                               │─────────────────││
                                               │ modelId         ││
                                               │ documentId      ││
                                               │ isPrimary       ││
                                               │ relevance       ││
                                               └─────────────────┘│
                                                                  │
                                                                  │
┌─────────────────────────────────────────────────────────────────│───────────────┐
│                       SERIAL DECODE ENGINE                      │               │
└─────────────────────────────────────────────────────────────────│───────────────┘
                                                                  │
  ┌──────────────────┐                                           │
  │  SERIAL PATTERN  │  (Database-driven decode rules)           │
  │──────────────────│                                           │
  │ id               │                                           │
  │ name             │  "Carrier 2004+ Format"                   │
  │ brandId ─────────│───────────────────────────────────────────┘
  │ productLineId    │  (Optional - can be brand or line level)
  │ regex            │  ^([0-9]{2})([0-9]{2})[A-Z].*
  │ decodeRules      │  ← JSON (see below)
  │ confidence       │
  │ validFrom        │  Year range when pattern applies
  │ validTo          │
  │ priority         │  Higher = check first
  │ isActive         │
  └────────┬─────────┘
           │ 1:N
           ├──────────────────┐
           ▼                  ▼
  ┌──────────────────┐ ┌──────────────────┐
  │    CITATION      │ │ PATTERN EXAMPLE  │
  │──────────────────│ │──────────────────│
  │ id               │ │ id               │
  │ patternId        │ │ patternId        │
  │ documentId       │ │ serial           │
  │ pageStart        │ │ expectedYear     │
  │ pageEnd          │ │ expectedMonth    │
  │ excerpt          │ │ expectedWeek     │
  └──────────────────┘ │ isVerified       │
                       └──────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                           DECODE RULES JSON FORMAT                               │
└─────────────────────────────────────────────────────────────────────────────────┘

Example decodeRules for Carrier:
{
  "positions": [
    {
      "range": [0, 2],
      "field": "week",
      "type": "numeric"
    },
    {
      "range": [2, 4],
      "field": "year",
      "type": "numeric",
      "transform": { "add": 2000 }
    },
    {
      "range": [4, 5],
      "field": "plant",
      "type": "lookup",
      "values": { "A": "Indianapolis", "B": "Tyler" }
    }
  ],
  "output": {
    "dateFormat": "week-year",
    "explanation": "Week {week} of {year}"
  }
}


┌─────────────────────────────────────────────────────────────────────────────────┐
│                              USER & AUTH SYSTEM                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────────┐     ┌──────────────────┐
  │      USER        │     │   ORGANIZATION   │
  │──────────────────│     │──────────────────│
  │ id               │     │ id               │
  │ email            │     │ name             │
  │ name             │◄────│                  │
  │ passwordHash     │     └──────────────────┘
  │ role             │
  │ tier             │  Role: PUBLIC | FREE | MEMBER | ADMIN
  │ orgId            │  Tier: FREE | GOLD | PLATINUM | TEAM | ENTERPRISE
  └────────┬─────────┘
           │ 1:N
           ├──────────────────┬───────────────────┐
           ▼                  ▼                   ▼
  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
  │    OCR JOB       │ │    FEEDBACK      │ │   AUDIT LOG      │
  │──────────────────│ │──────────────────│ │──────────────────│
  │ userId           │ │ userId           │ │ userId           │
  │ imageUrl         │ │ type             │ │ action           │
  │ extractedText    │ │ status           │ │ entityType       │
  │ extractedSerial  │ │ payloadJson      │ │ entityId         │
  │ confidence       │ │ notes            │ │ oldValue/newValue│
  │ status           │ └──────────────────┘ └──────────────────┘
  └──────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                              TAGGING SYSTEM                                      │
└─────────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────────┐     ┌──────────────────┐
  │      TAG         │     │  DOCUMENT TAG    │ (Junction)
  │──────────────────│     │──────────────────│
  │ id               │◄────│ tagId            │
  │ name             │     │ documentId       │───► Document
  │ category         │     └──────────────────┘
  └──────────────────┘

   Tag Categories:
   ├─ equipment_type (furnace, heat_pump, ac)
   ├─ fuel_type (gas, electric, oil)
   ├─ feature (modulating, two_stage, inverter)
   └─ region (north_america, europe)


┌─────────────────────────────────────────────────────────────────────────────────┐
│                          QUERY FLOW EXAMPLES                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

1. DECODE SERIAL NUMBER
   Input: brand="Carrier", serial="2106A12345"
   ┌───────────────┐
   │ Find Brand    │
   └───────┬───────┘
           ▼
   ┌───────────────┐
   │ Get Patterns  │ ← Filter by brandId, validFrom/To, isActive
   └───────┬───────┘
           ▼
   ┌───────────────┐
   │ Test Regex    │ ← Order by priority
   └───────┬───────┘
           ▼
   ┌───────────────┐
   │ Apply Decode  │ ← Parse positions, apply transforms
   └───────┬───────┘
           ▼
   ┌───────────────┐
   │ Get Citations │ ← Show source document + page reference
   └───────────────┘

2. FIND SERVICE MANUAL
   Input: brand="Carrier", model="59MN7A100"
   ┌───────────────┐
   │ Find Model    │
   └───────┬───────┘
           ▼
   ┌───────────────┐
   │ Get Hierarchy │ ← Model → ProductLine → Brand
   └───────┬───────┘
           ▼
   ┌───────────────┐
   │ Join Docs     │ ← ModelDocument + ProductLineDocument + BrandDocument
   └───────┬───────┘
           ▼
   ┌───────────────┐
   │ Filter Type   │ ← DocumentType.code = 'SERVICE_MANUAL'
   └───────┬───────┘
           ▼
   ┌───────────────┐
   │ Rank Results  │ ← isPrimary, relevance, isOfficial
   └───────────────┘

3. AI-ASSISTED SEARCH (Low Temperature)
   Input: query="error code 41 on Carrier furnace"
   ┌───────────────┐
   │ Parse Query   │ ← Extract brand, error code, equipment type
   └───────┬───────┘
           ▼
   ┌───────────────┐
   │ Search Docs   │ ← Paperless full-text + metadata filter
   └───────┬───────┘
           ▼
   ┌───────────────┐
   │ Prioritize    │ ← SERVICE_MANUAL, TECH_BULLETIN first
   └───────┬───────┘
           ▼
   ┌───────────────────────────────────────┐
   │ AI Summary    │ ← temperature=0.2 for accuracy
   │               │   Context: retrieved document excerpts
   │               │   Task: Answer user question
   └───────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                         INTEGRATION POINTS                                       │
└─────────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────┐
                    │      PORTAL (Next.js)       │
                    │─────────────────────────────│
                    │ /api/decode                 │
                    │ /api/search                 │
                    │ /api/documents              │
                    │ /api/chat (AI Assistant)    │
                    └─────────────┬───────────────┘
                                  │
            ┌─────────────────────┼─────────────────────┐
            │                     │                     │
            ▼                     ▼                     ▼
   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
   │   SQLite/PG     │   │  Paperless-ngx  │   │   OpenAI API    │
   │   (Prisma)      │   │  (Documents)    │   │  (temp=0.2)     │
   │─────────────────│   │─────────────────│   │─────────────────│
   │ Users           │   │ Full-text       │   │ Chat completion │
   │ Products        │   │ OCR content     │   │ Query parsing   │
   │ SerialPatterns  │   │ PDF storage     │   │ Summarization   │
   │ Documents (meta)│   │ Thumbnails      │   │                 │
   └─────────────────┘   └─────────────────┘   └─────────────────┘

