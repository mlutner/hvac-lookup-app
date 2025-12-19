import { searchDocuments } from '@/lib/paperless/client'
import { decodeSerial, ruleEngine } from '@/lib/ruleEngine'
import { Citation, ChatResponse } from '@/types'

/**
 * Intent detection patterns
 */
const DECODE_PATTERNS = [
  /decode\s+(?:serial|sn)\s*(?:number)?/i,
  /what\s+(?:year|date|age)\s+(?:is|was)/i,
  /when\s+was\s+(?:this|it|my)\s+(?:unit|equipment|ac|furnace|hvac)/i,
  /manufacture\s*(?:date|year)/i,
  /how\s+old\s+is/i,
  /serial\s*(?:number)?\s*(?:lookup|check|decode)/i,
]

const BRAND_EXTRACTION = /(?:carrier|trane|lennox|rheem|ruud|goodman|amana|york|bryant)/i
const SERIAL_EXTRACTION = /\b([A-Z0-9]{6,15})\b/i

interface ChatContext {
  brand?: string
  serial?: string
  model?: string
}

/**
 * Citation-locked chatbot that refuses to answer without evidence
 *
 * Key principles:
 * 1. Only answer from indexed documents
 * 2. Always cite sources (doc + page + excerpt)
 * 3. If no evidence found, explicitly refuse
 * 4. Never hallucinate or make up information
 */
export class Chatbot {
  /**
   * Process a user message and generate a response
   */
  async processMessage(message: string, context: ChatContext = {}): Promise<ChatResponse> {
    // Detect intent
    const isDecodeIntent = DECODE_PATTERNS.some(p => p.test(message))

    // Extract brand and serial if present
    const brandMatch = message.match(BRAND_EXTRACTION)
    const serialMatch = message.match(SERIAL_EXTRACTION)

    const brand = brandMatch?.[0] || context.brand
    const serial = serialMatch?.[1] || context.serial

    // If decode intent and we have brand + serial, use rule engine
    if (isDecodeIntent && brand && serial) {
      return this.handleDecodeIntent(brand, serial, context.model)
    }

    // Otherwise, search documents and answer from results
    return this.handleSearchIntent(message)
  }

  /**
   * Handle decode serial number intent
   */
  private async handleDecodeIntent(
    brand: string,
    serial: string,
    model?: string
  ): Promise<ChatResponse> {
    const result = decodeSerial({ brand, serial, model })

    if (result.manufactureDate) {
      return {
        message: `Based on the serial number ${serial} for ${brand}, the ${result.explanation.toLowerCase()}.\n\nConfidence: ${Math.round(result.confidence * 100)}%${
          result.warnings.length > 0 ? '\n\nNote: ' + result.warnings.join(' ') : ''
        }`,
        citations: result.citations,
        type: 'decode',
      }
    }

    return {
      message: `I could not decode the serial number "${serial}" for ${brand}. ${result.explanation}\n\nPlease verify the serial number is correct. You can also submit this for manual review or request assistance.`,
      citations: result.citations,
      type: 'decode',
    }
  }

  /**
   * Handle general search intent - answer only from documents
   */
  private async handleSearchIntent(query: string): Promise<ChatResponse> {
    try {
      // Search Paperless for relevant documents
      const searchResults = await searchDocuments(query, { pageSize: 5 })

      if (searchResults.results.length === 0) {
        return {
          message: 'I could not find any relevant information in the indexed manuals and documentation for your query. Please try rephrasing your question or browsing the brand index for specific information.',
          citations: [],
          type: 'no_results',
        }
      }

      // Build response from search results
      const citations: Citation[] = []
      const excerpts: string[] = []

      for (const doc of searchResults.results) {
        if (doc.__search_hit__?.highlights) {
          // Clean up highlights (remove HTML tags)
          const cleanHighlight = doc.__search_hit__.highlights
            .replace(/<\/?em>/g, '')
            .replace(/<[^>]*>/g, '')
            .trim()

          if (cleanHighlight) {
            excerpts.push(cleanHighlight)

            citations.push({
              paperlessDocId: doc.id.toString(),
              pageStart: 1, // Page info not available from search
              pageEnd: doc.page_count || 1,
              excerpt: cleanHighlight.slice(0, 200),
            })
          }
        }
      }

      if (citations.length === 0) {
        return {
          message: 'I found some documents that might be relevant, but I could not extract specific information to answer your question. Please check the search results for more details.',
          citations: [],
          type: 'no_results',
        }
      }

      // Compose answer from excerpts
      const response = this.composeResponse(query, excerpts, searchResults.results.map(r => r.title))

      return {
        message: response,
        citations,
        type: 'search',
      }
    } catch (error) {
      console.error('Chatbot search error:', error)
      return {
        message: 'I encountered an error while searching the documentation. Please try again or use the manual search feature.',
        citations: [],
        type: 'no_results',
      }
    }
  }

  /**
   * Compose a response from search excerpts
   * This is a simple extractive approach - in production, you'd use an LLM
   */
  private composeResponse(query: string, excerpts: string[], titles: string[]): string {
    if (excerpts.length === 0) {
      return 'No relevant information found.'
    }

    // Simple extractive response
    const intro = `Based on the indexed documentation, here's what I found:\n\n`

    const content = excerpts.slice(0, 3).map((excerpt, i) => {
      return `From "${titles[i]}":\n"${excerpt.slice(0, 300)}${excerpt.length > 300 ? '...' : ''}"`
    }).join('\n\n')

    const outro = '\n\nPlease see the cited sources below for full details.'

    return intro + content + outro
  }

  /**
   * Get supported brands list
   */
  getSupportedBrands(): string[] {
    return ruleEngine.getSupportedBrands()
  }
}

// Singleton instance (legacy keyword-based chatbot)
export const chatbot = new Chatbot()

/**
 * Legacy convenience function (keyword search only)
 * @deprecated Use processRAGChat for higher accuracy
 */
export function processChat(
  message: string,
  context?: ChatContext
): Promise<ChatResponse> {
  return chatbot.processMessage(message, context)
}

// Export RAG-enhanced chatbot for high-accuracy responses
export { processRAGChat, ragChatbot } from './ragChat'
