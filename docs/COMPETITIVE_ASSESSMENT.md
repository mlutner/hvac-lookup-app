# HVAC Lookup Portal - Competitive Assessment

## Executive Summary

The HVAC Lookup Portal has been architected with **best-in-class technology** that surpasses all known competitors in capability. However, the current implementation lacks the **data coverage** needed to compete on day-to-day usefulness.

**Bottom Line**: Superior technology, insufficient data. Focus on data acquisition to unlock full potential.

---

## Competitive Landscape

### 1. Building Intelligence Center
**Website**: https://www.building-center.org/

**What They Do**:
- Manual serial number lookup tables
- Text-based decode instructions by brand
- Estimated service life information
- IRC Building Code reference (members only)

**Pricing**: $15/year for ad-free + member resources

**Strengths**:
- Large brand database (~100+ manufacturers)
- Trusted by home inspectors
- Simple, focused UI
- Works on any device

**Weaknesses**:
- Manual lookup only (no AI)
- No full document access
- No semantic search
- No troubleshooting capability
- Can't read actual manuals

---

### 2. HVAC Decoder App
**Website**: http://www.hvacdecoder.com/

**What They Do**:
- Mobile app for iOS, Android, Windows, Mac
- Decodes model numbers AND serial numbers
- Static database with regular updates
- Email results feature

**Pricing**: $9.99 one-time purchase

**Strengths**:
- Native mobile apps (works offline)
- "Many thousands" of model numbers
- Free lifetime updates
- Fast lookup

**Weaknesses**:
- Static database (no AI understanding)
- No full manual access
- No troubleshooting from service docs
- No semantic search
- Can't answer "why" questions

---

### 3. HVAC Lookup Portal (Our Solution)
**Technology Stack**:
- Paperless-ngx (document management + OCR)
- PostgreSQL + pgvector (semantic search)
- Google Gemini 3 Flash Preview (AI)
- Next.js (frontend)
- OpenRouter (unified AI API)

**Pricing**: Self-hosted (free, ~$20-50/month API costs)

---

## Feature Comparison Matrix

| Feature | Building Intelligence | HVAC Decoder | **Our Portal** |
|---------|----------------------|--------------|----------------|
| **Serial Decode** | Manual tables | Static DB | AI + Rules |
| **Model Decode** | Limited | Yes | Yes (planned) |
| **Full Manuals** | No | No | **Yes** |
| **AI Assistant** | No | No | **Gemini 3** |
| **Semantic Search** | No | No | **pgvector** |
| **Citations** | Manual refs | None | **Auto page-level** |
| **Tool Use** | No | No | **Function calling** |
| **Context Window** | N/A | N/A | **1M tokens** |
| **Troubleshooting** | No | No | **Service manual RAG** |
| **Spec Lookup** | No | Partial | **Full from docs** |
| **Offline Mode** | No | **Yes** | No |
| **Mobile App** | No | **Native** | Web only |
| **Brand Coverage** | **100+** | **1000s models** | ~6 brands |
| **Price** | $15/yr | $9.99 | Free (self-host) |

---

## Our Competitive Advantages

### 1. AI-Powered Understanding
- **Only solution** using LLM with tool use
- Can understand context and follow-up questions
- Answers "why" not just "what"
- Can synthesize information across multiple documents

### 2. Full Document Access
- View original manufacturer PDFs
- OCR text extraction for search
- Page-level citations
- Not limited to decode guides

### 3. Semantic Search
- Understands meaning, not just keywords
- "What's the efficiency rating?" finds SEER/AFUE
- Intent detection routes to right document type
- Re-ranking by relevance

### 4. Extensibility
- Database-driven rules (no code changes)
- Admin UI for pattern management (planned)
- Document type classification
- Hierarchical product structure

### 5. Self-Hosted
- No recurring subscription
- Data stays private
- Customizable for organization needs
- Can add internal documents

### 6. Gemini 3 Flash Preview
- 1M token context (read entire manuals)
- Excellent tool use / function calling
- Configurable thinking levels
- Near-Pro quality at Flash cost

---

## Our Weaknesses (Gaps to Address)

### 1. Brand Coverage (CRITICAL)
| Current | Target | Gap |
|---------|--------|-----|
| 6 brands | 50+ | 44 brands |
| 10 documents | 500+ | 490 documents |
| 5 serial patterns | 200+ | 195 patterns |

**Impact**: Users won't adopt without their equipment brands

### 2. Mobile Experience
- No native app
- PWA not implemented
- No camera OCR for serial capture
- Responsive web only

**Impact**: Field technicians need mobile-first

### 3. Offline Capability
- Requires internet connection
- HVAC Decoder works offline
- Could cache decoded results locally

**Impact**: Inspections often in poor connectivity areas

### 4. Data Quality
- Serial patterns not verified against real units
- Missing test cases for pattern validation
- No user-reported data mechanism

**Impact**: Accuracy claims unverified

---

## Market Position Analysis

```
                    ACCURACY / AI CAPABILITY
                              ▲
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          │     HVAC          │                   │
    HIGH  │    LOOKUP    ★    │                   │
          │    PORTAL         │                   │
          │                   │                   │
          ├───────────────────┼───────────────────┤
          │                   │                   │
          │                   │    Building       │
   MEDIUM │                   │  Intelligence     │
          │                   │     Center        │
          │                   │                   │
          ├───────────────────┼───────────────────┤
          │                   │                   │
          │                   │    HVAC           │
    LOW   │                   │   Decoder         │
          │                   │     App           │
          │                   │                   │
          └───────────────────┴───────────────────┘
                    LOW              HIGH
                       BRAND COVERAGE
```

**Strategic Position**: High capability, low coverage
**Strategy**: Rapidly expand data while competitors can't match AI

---

## Recommended Roadmap

### Phase 1: Data Foundation (Weeks 1-4)
**Goal**: Achieve feature parity on brand coverage

- [ ] Upload 50 major brand decode guides
- [ ] Add serial patterns for top 20 brands
- [ ] Create 100+ verified test cases
- [ ] Generate embeddings for all documents
- [ ] Validate accuracy with real serial numbers

**Brands to Prioritize**:
1. Carrier / Bryant / Payne (UTC)
2. Trane / American Standard
3. Lennox
4. Rheem / Ruud
5. Goodman / Amana / Daikin
6. York / Coleman / Luxaire (JCI)
7. Heil / Tempstar / Arcoaire
8. Bosch
9. Mitsubishi
10. Fujitsu

### Phase 2: Mobile & UX (Weeks 5-8)
**Goal**: Match competitor accessibility

- [ ] PWA implementation
- [ ] Camera OCR for serial capture
- [ ] Offline result caching
- [ ] Mobile-optimized UI
- [ ] Quick decode mode (serial → date)

### Phase 3: Differentiation (Weeks 9-12)
**Goal**: Features competitors can't match

- [ ] Full troubleshooting from service manuals
- [ ] Parts lookup with diagrams
- [ ] Wiring diagram viewer
- [ ] Error code database
- [ ] Multi-language support

### Phase 4: Growth (Ongoing)
**Goal**: Build user base and data flywheel

- [ ] User feedback / missing data reporting
- [ ] Community contributions
- [ ] API for integrations
- [ ] White-label for inspection companies

---

## Cost Comparison

### Building Intelligence Center
- $15/year
- No API costs
- Limited features

### HVAC Decoder App
- $9.99 one-time
- No API costs
- Static data

### HVAC Lookup Portal
**Self-Hosted Costs**:
| Item | Monthly Cost |
|------|-------------|
| Server (VPS) | $20-50 |
| OpenRouter API | $20-50 |
| Storage | $5-10 |
| **Total** | **$45-110/month** |

**For Organization (1000 lookups/day)**:
- Embedding: ~$3 one-time
- Queries: ~$15-30/month
- Total: **$50-80/month**

**Cost per lookup**: ~$0.002

---

## Conclusion

The HVAC Lookup Portal has **architectural superiority** over all known competitors:

| Competitor | Can Add AI? | Can Add Full Docs? | Can Add Semantic? |
|------------|-------------|--------------------|--------------------|
| Building Intelligence | Difficult | Very Difficult | No |
| HVAC Decoder | Difficult | Very Difficult | No |
| **Our Portal** | **Already has** | **Already has** | **Already has** |

**The moat is the architecture**. Competitors would need to rebuild from scratch to match capabilities.

**The gap is data**. Fill it to win.

---

## Sources

- [Building Intelligence Center](https://www.building-center.org/)
- [HVAC Decoder App](https://apps.apple.com/us/app/hvac-decoder/id1355543096)
- [Gemini 3 Flash Preview](https://openrouter.ai/google/gemini-3-flash-preview)
- [OpenRouter Embeddings](https://openrouter.ai/docs/api/reference/embeddings)
