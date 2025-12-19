/**
 * AI Assistant Configuration
 *
 * Using Google Gemini 3 Flash Preview for maximum accuracy and tool use.
 * - 1M token context window (can read full manuals)
 * - Excellent tool use and reasoning
 * - Configurable thinking levels for accuracy
 * - Low temperature for factual HVAC queries
 *
 * Model: google/gemini-3-flash-preview via OpenRouter
 * Pricing: $0.50/M input, $3/M output
 */

import { AIConfig } from '@/types'

// Default model - Gemini 3 Flash Preview (best for accuracy + tool use)
export const DEFAULT_MODEL = 'google/gemini-3-flash-preview'

// Low temperature for accurate technical responses
export const AI_CONFIG: AIConfig = {
  temperature: 0.1, // Very low for accuracy - NEVER hallucinate HVAC specs!
  maxTokens: 2048,
  model: process.env.AI_MODEL || DEFAULT_MODEL,
  systemPrompt: `You are a precise HVAC technical assistant with access to indexed manufacturer documentation. Your role is to help inspectors and technicians:

1. Decode serial numbers to find manufacture dates
2. Find specifications for HVAC equipment
3. Answer questions about installation, maintenance, and troubleshooting

CRITICAL ACCURACY RULES:
- ONLY answer based on the provided document excerpts - never use general knowledge
- ALWAYS cite the exact source document and page number for every fact
- If information is not in the provided documents, say "I don't have that information in the indexed documentation"
- NEVER make up specifications, dates, model numbers, or technical details
- When decoding serial numbers, show your work step by step
- Express confidence levels (high/medium/low) based on source quality

OUTPUT FORMAT:
- Be concise and direct
- Use bullet points for specifications
- Always include [Source: Document Name, Page X] for each fact
- If uncertain, explicitly state what you don't know

TOOLS AVAILABLE:
- search_documents: Search the manual database for relevant information
- get_document: Retrieve full document content by ID
- decode_serial: Use rule engine to decode serial numbers`,
}

// Configuration for different use cases - optimized for Gemini 3 Flash
export const AI_CONFIGS = {
  // Serial number decoding - needs highest accuracy
  decode: {
    ...AI_CONFIG,
    temperature: 0.0, // Zero temperature for deterministic date extraction
    maxTokens: 1024,
    thinkingLevel: 'high', // Use extended reasoning for accuracy
    systemPrompt: `You decode HVAC serial numbers to determine manufacture dates with high precision.

Given a brand, serial number, and document excerpts about that brand's serial number format:
1. Identify which format/pattern applies to this serial number
2. Extract each date component step by step, showing your work
3. State the manufacture date with confidence level
4. Cite the exact source document and page

RULES:
- If the serial format is not in the provided documents, say "Format not found in documentation"
- NEVER guess or extrapolate dates
- Show calculation: "Position 1-2 = '24' → Year 2024 (base 2000 + 24)"
- If multiple patterns could match, list all possibilities with confidence levels`,
  },

  // Spec lookup - needs high accuracy
  specs: {
    ...AI_CONFIG,
    temperature: 0.1,
    maxTokens: 1536,
    thinkingLevel: 'medium',
    systemPrompt: `You help find HVAC equipment specifications from indexed documentation.

Given document excerpts, extract and present ONLY specifications that are explicitly stated:
- Model numbers and variations
- Capacity (BTU, tons, CFM)
- Efficiency ratings (SEER, SEER2, EER, AFUE, HSPF, COP)
- Dimensions and weights
- Electrical requirements (voltage, phase, amps)
- Refrigerant type and charge
- Operating ranges

RULES:
- ONLY provide specs that are explicitly stated in the documents
- Always cite [Source: Document Name, Page X] for each specification
- Never estimate, round, or approximate values
- If a spec is not found, say "Not specified in available documentation"`,
  },

  // Troubleshooting - can be slightly more conversational but still accurate
  troubleshoot: {
    ...AI_CONFIG,
    temperature: 0.2,
    maxTokens: 2048,
    thinkingLevel: 'high', // Extended reasoning for diagnostics
    systemPrompt: `You help troubleshoot HVAC equipment issues using indexed service documentation.

Given document excerpts from service manuals:
1. Identify relevant error codes or symptoms from the documentation
2. Provide step-by-step diagnostic procedures AS WRITTEN in the manual
3. List possible causes and solutions from the documentation
4. Include any safety warnings mentioned

RULES:
- Base ALL advice on the provided documentation - never improvise procedures
- Cite [Source: Document Name, Page X] for each procedure
- Include exact voltage/pressure readings if specified
- Always recommend professional service for: gas leaks, refrigerant handling, high voltage
- If documentation doesn't cover this issue, say so clearly`,
  },

  // Installation guidance
  install: {
    ...AI_CONFIG,
    temperature: 0.1,
    maxTokens: 2048,
    thinkingLevel: 'medium',
    systemPrompt: `You provide installation guidance from indexed HVAC documentation.

Given document excerpts from installation manuals:
1. Provide step-by-step procedures AS WRITTEN in the documentation
2. Include clearance requirements, electrical specs, and venting requirements
3. Note any code requirements or safety warnings mentioned

RULES:
- Follow documentation exactly - never improvise installation steps
- Cite [Source: Document Name, Page X] for each requirement
- Include all safety warnings from the documentation
- If specific requirements aren't documented, say "Check local codes"`,
  },

  // General questions
  general: {
    ...AI_CONFIG,
    temperature: 0.2,
    maxTokens: 2048,
    thinkingLevel: 'medium',
  },
} as const

export type AIConfigType = keyof typeof AI_CONFIGS

/**
 * Get AI config for a specific use case
 */
export function getAIConfig(type: AIConfigType = 'general'): AIConfig & { thinkingLevel?: string } {
  return AI_CONFIGS[type]
}

/**
 * Tool definitions for Gemini 3 Flash function calling
 */
export const HVAC_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_documents',
      description: 'Search the HVAC documentation database for relevant manuals and guides',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query for finding relevant documents',
          },
          brand: {
            type: 'string',
            description: 'Filter by brand name (e.g., Carrier, Trane, Lennox)',
          },
          documentType: {
            type: 'string',
            enum: ['DECODE_GUIDE', 'SERVICE_MANUAL', 'SPEC_SHEET', 'INSTALLATION', 'WIRING_DIAGRAM', 'PARTS_LIST', 'TECH_BULLETIN', 'USER_MANUAL'],
            description: 'Filter by document type',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_document_content',
      description: 'Retrieve the full content of a specific document by its Paperless ID',
      parameters: {
        type: 'object',
        properties: {
          documentId: {
            type: 'string',
            description: 'The Paperless document ID',
          },
          pageRange: {
            type: 'string',
            description: 'Optional page range to retrieve (e.g., "1-5" or "10")',
          },
        },
        required: ['documentId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'decode_serial',
      description: 'Decode an HVAC serial number using the rule engine to determine manufacture date',
      parameters: {
        type: 'object',
        properties: {
          brand: {
            type: 'string',
            description: 'Brand name (e.g., Carrier, Trane, Lennox)',
          },
          serial: {
            type: 'string',
            description: 'Serial number to decode',
          },
          model: {
            type: 'string',
            description: 'Optional model number for additional context',
          },
        },
        required: ['brand', 'serial'],
      },
    },
  },
]

/**
 * Validate that AI responses stay grounded in provided context
 */
export function validateGroundedResponse(
  response: string,
  sourceExcerpts: string[]
): { isGrounded: boolean; warnings: string[] } {
  const warnings: string[] = []

  // Check for hedging language that suggests uncertainty
  const uncertainPhrases = [
    'i think',
    'probably',
    'might be',
    'could be',
    'approximately',
    'around',
    'roughly',
    'i believe',
    'it seems',
    'possibly',
  ]

  for (const phrase of uncertainPhrases) {
    if (response.toLowerCase().includes(phrase)) {
      warnings.push(
        `Response contains uncertain language: "${phrase}". Verify accuracy.`
      )
    }
  }

  // Check for missing citations
  if (!response.includes('[Source:') && !response.includes('[SOURCE')) {
    warnings.push('Response does not include source citations.')
  }

  // Check if response mentions information not in sources
  const responseWords = new Set(
    response.toLowerCase().split(/\s+/).filter(w => w.length > 4)
  )
  const sourceWords = new Set(
    sourceExcerpts.join(' ').toLowerCase().split(/\s+/).filter(w => w.length > 4)
  )

  // If response has many words not in sources, it might be hallucinating
  const newWords = [...responseWords].filter(w => !sourceWords.has(w))
  const noveltyRatio = newWords.length / responseWords.size

  if (noveltyRatio > 0.5) {
    warnings.push(
      'Response contains many terms not in source documents. Verify accuracy.'
    )
  }

  return {
    isGrounded: warnings.length === 0,
    warnings,
  }
}
