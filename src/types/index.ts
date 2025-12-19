// User roles for access control
export enum UserRole {
  PUBLIC = 'PUBLIC',
  FREE = 'FREE',
  MEMBER = 'MEMBER',
  ADMIN = 'ADMIN',
}

// Membership tiers for billing
export enum MembershipTier {
  FREE = 'FREE',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
  TEAM = 'TEAM',
  ENTERPRISE = 'ENTERPRISE',
}

// ============================================================================
// DOCUMENT CLASSIFICATION TYPES
// ============================================================================

// Document type codes (controlled vocabulary)
export enum DocumentTypeCode {
  DECODE_GUIDE = 'DECODE_GUIDE',
  SERVICE_MANUAL = 'SERVICE_MANUAL',
  SPEC_SHEET = 'SPEC_SHEET',
  INSTALLATION = 'INSTALLATION',
  WIRING_DIAGRAM = 'WIRING_DIAGRAM',
  PARTS_LIST = 'PARTS_LIST',
  TECH_BULLETIN = 'TECH_BULLETIN',
  USER_MANUAL = 'USER_MANUAL',
  UNKNOWN = 'UNKNOWN',
}

// Document intent mapping - what users are looking for
export type UserIntent =
  | 'decode'       // "How old is my unit?"
  | 'specs'        // "What are the specs?"
  | 'install'      // "How to install?"
  | 'troubleshoot' // "How do I fix error X?"
  | 'wiring'       // "Where does this wire go?"
  | 'parts'        // "What parts do I need?"
  | 'general'      // General questions

// Intent to document type priority mapping
export const INTENT_DOC_PRIORITY: Record<UserIntent, DocumentTypeCode[]> = {
  decode: [DocumentTypeCode.DECODE_GUIDE, DocumentTypeCode.TECH_BULLETIN],
  specs: [DocumentTypeCode.SPEC_SHEET, DocumentTypeCode.SERVICE_MANUAL],
  install: [DocumentTypeCode.INSTALLATION, DocumentTypeCode.USER_MANUAL],
  troubleshoot: [DocumentTypeCode.SERVICE_MANUAL, DocumentTypeCode.TECH_BULLETIN],
  wiring: [DocumentTypeCode.WIRING_DIAGRAM, DocumentTypeCode.SERVICE_MANUAL],
  parts: [DocumentTypeCode.PARTS_LIST, DocumentTypeCode.SERVICE_MANUAL],
  general: [DocumentTypeCode.SERVICE_MANUAL, DocumentTypeCode.USER_MANUAL],
}

// ============================================================================
// SERIAL DECODE ENGINE TYPES
// ============================================================================

// Position-based decode instruction
export interface DecodePosition {
  range: [number, number] // Start and end index
  field: 'year' | 'month' | 'week' | 'day' | 'plant' | 'sequence' | 'custom'
  type: 'numeric' | 'alpha' | 'lookup'
  transform?: {
    add?: number      // e.g., add: 2000 to convert "24" → 2024
    subtract?: number
    multiply?: number
    map?: Record<string, string> // For lookup type
  }
  values?: Record<string, string> // For lookup type: { "A": "Indianapolis" }
}

// Serial pattern decode rules (JSON structure)
export interface DecodeRulesJson {
  positions: DecodePosition[]
  output: {
    dateFormat: 'year' | 'month-year' | 'week-year' | 'full-date'
    explanation: string // Template: "Week {week} of {year}"
  }
  notes?: string
}

// AI assistant configuration
export interface AIConfig {
  temperature: number  // 0.0-1.0, low for accuracy
  maxTokens: number
  model: string
  systemPrompt: string
}

// Rule engine types
export interface DecodeResult {
  manufactureDate: string | null
  confidence: number
  explanation: string
  matchedRuleId: string | null
  citations: Citation[]
  warnings: string[]
}

export interface Citation {
  paperlessDocId: string
  pageStart: number
  pageEnd: number
  excerpt: string
}

export interface DecodeInput {
  brand: string
  serial: string
  model?: string
}

// OCR types
export interface OCRResult {
  extractedText: string
  extractedSerial: string | null
  extractedModel: string | null
  confidence: number
  boundingBoxes?: BoundingBox[]
}

export interface BoundingBox {
  text: string
  x: number
  y: number
  width: number
  height: number
  confidence: number
}

// Paperless API types
export interface PaperlessDocument {
  id: number
  title: string
  content: string
  created: string
  added: string
  modified: string
  correspondent: number | null
  document_type: number | null
  storage_path: number | null
  tags: number[]
  archive_serial_number: number | null
  original_file_name: string
  page_count: number
}

export interface PaperlessSearchResult extends PaperlessDocument {
  __search_hit__?: {
    score: number
    highlights: string
    note_highlights: string
    rank: number
  }
}

export interface PaperlessSearchResponse {
  count: number
  next: string | null
  previous: string | null
  results: PaperlessSearchResult[]
}

// Feedback types
export enum FeedbackType {
  ERROR_REPORT = 'ERROR_REPORT',
  NEW_INFO = 'NEW_INFO',
  ASSISTANCE_REQUEST = 'ASSISTANCE_REQUEST',
}

export enum FeedbackStatus {
  PENDING = 'PENDING',
  IN_REVIEW = 'IN_REVIEW',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}

// Chatbot types
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  timestamp: Date
}

export interface ChatResponse {
  message: string
  citations: Citation[]
  type: 'decode' | 'search' | 'no_results'
}
