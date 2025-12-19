/**
 * RAG-Enhanced Chat with Gemini 3 Flash Preview
 *
 * High-accuracy chatbot using:
 * - Semantic search (pgvector embeddings)
 * - Google Gemini 3 Flash Preview for response generation
 * - Tool use for searching documents and decoding serials
 * - Strict citation requirements
 *
 * Model: google/gemini-3-flash-preview via OpenRouter
 * Features:
 * - 1M token context (can read full manuals)
 * - Excellent tool use and function calling
 * - Configurable thinking levels (minimal/low/medium/high)
 * - Zero/low temperature for factual accuracy
 */

import { ChatResponse, Citation } from '@/types'
import { generateEmbedding } from '@/lib/embeddings/openai'
import { searchSimilar } from '@/lib/embeddings/vectorStore'
import { EMBEDDING_CONFIG, QueryIntent } from '@/lib/embeddings/config'
import { AI_CONFIGS, DEFAULT_MODEL, HVAC_TOOLS } from '@/lib/ai/config'
import { decodeSerial } from '@/lib/ruleEngine'
import { getDocumentContent } from '@/lib/paperless/client'

const OPENROUTER_CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions'

interface ChatContext {
  brand?: string
  serial?: string
  model?: string
}

interface RAGContext {
  content: string
  documentTitle: string
  documentType: string | null
  pageNumber: number | null
  paperlessDocId: string
  similarity: number
}

// Intent detection patterns
const DECODE_PATTERNS = [
  /decode\s+(?:serial|sn)\s*(?:number)?/i,
  /what\s+(?:year|date|age)\s+(?:is|was)/i,
  /when\s+was\s+(?:this|it|my)\s+(?:unit|equipment|ac|furnace|hvac)/i,
  /manufacture\s*(?:date|year)/i,
  /how\s+old\s+is/i,
  /serial\s*(?:number)?\s*(?:lookup|check|decode)/i,
]

const BRAND_EXTRACTION = /(?:carrier|trane|lennox|rheem|ruud|goodman|amana|york|bryant|bosch|weil-mclain)/i
const SERIAL_EXTRACTION = /\b([A-Z0-9]{6,15})\b/i

/**
 * Detect query intent
 */
function detectIntent(query: string): QueryIntent {
  if (DECODE_PATTERNS.some((p) => p.test(query))) return 'decode'
  if (/spec|specification|btu|seer|afue|capacity|efficiency|rating/i.test(query)) return 'specs'
  if (/error|fault|code|problem|troubleshoot|diagnose|not working/i.test(query)) return 'troubleshoot'
  if (/install|setup|mount|connect|wire|vent/i.test(query)) return 'install'
  return 'general'
}

/**
 * Process a chat message using RAG + Gemini 3 Flash
 */
export async function processRAGChat(
  message: string,
  context: ChatContext = {}
): Promise<ChatResponse & { confidence: number; model: string }> {
  const intent = detectIntent(message)

  // Extract brand and serial if present
  const brandMatch = message.match(BRAND_EXTRACTION)
  const serialMatch = message.match(SERIAL_EXTRACTION)
  const brand = brandMatch?.[0] || context.brand
  const serial = serialMatch?.[1] || context.serial

  // If decode intent with brand + serial, use rule engine first
  if (intent === 'decode' && brand && serial) {
    const decodeResult = decodeSerial({ brand, serial, model: context.model })

    if (decodeResult.manufactureDate) {
      return {
        message: `Based on the serial number **${serial}** for **${brand}**, the ${decodeResult.explanation.toLowerCase()}.\n\n**Confidence:** ${Math.round(decodeResult.confidence * 100)}%${
          decodeResult.warnings.length > 0 ? '\n\n**Note:** ' + decodeResult.warnings.join(' ') : ''
        }`,
        citations: decodeResult.citations,
        type: 'decode',
        confidence: decodeResult.confidence,
        model: 'rule-engine',
      }
    }
  }

  // Use semantic search for RAG
  try {
    const queryEmbedding = await generateEmbedding(message)

    const searchResults = await searchSimilar(queryEmbedding, {
      topK: 10, // Get more results for Gemini's large context
      threshold: EMBEDDING_CONFIG.retrieval.similarityThreshold,
      intent,
    })

    if (searchResults.length === 0) {
      return {
        message:
          'I could not find any relevant information in the indexed documentation for your query.\n\n**Suggestions:**\n• Rephrase your question with specific brand/model details\n• Check the spelling of technical terms\n• Browse the manual index directly\n• Try a more general search term',
        citations: [],
        type: 'no_results',
        confidence: 0,
        model: 'none',
      }
    }

    // Build context from search results
    const ragContext: RAGContext[] = searchResults.map((r) => ({
      content: r.content,
      documentTitle: r.documentTitle,
      documentType: r.documentTypeCode,
      pageNumber: r.pageNumber,
      paperlessDocId: r.paperlessDocId,
      similarity: r.similarity,
    }))

    // Generate response using Gemini 3 Flash with tool use
    const response = await generateGeminiResponse(message, ragContext, intent, { brand, serial })

    // Calculate confidence based on average similarity
    const avgSimilarity =
      ragContext.reduce((sum, c) => sum + c.similarity, 0) / ragContext.length
    const confidence = Math.min(avgSimilarity + 0.1, 1)

    // Build citations from context
    const citations: Citation[] = ragContext.map((c) => ({
      paperlessDocId: c.paperlessDocId,
      pageStart: c.pageNumber || 1,
      pageEnd: c.pageNumber || 1,
      excerpt: c.content.slice(0, 200),
    }))

    return {
      message: response,
      citations,
      type: 'search',
      confidence,
      model: DEFAULT_MODEL,
    }
  } catch (error) {
    console.error('RAG chat error:', error)
    return {
      message:
        'I encountered an error while searching the documentation. Please try again or use the manual search feature.',
      citations: [],
      type: 'no_results',
      confidence: 0,
      model: 'error',
    }
  }
}

/**
 * Generate response using Gemini 3 Flash Preview with tool use
 */
async function generateGeminiResponse(
  query: string,
  context: RAGContext[],
  intent: QueryIntent,
  extractedInfo: { brand?: string; serial?: string }
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    return generateExtractiveResponse(context)
  }

  const config = AI_CONFIGS[intent] || AI_CONFIGS.general
  const thinkingLevel = (config as { thinkingLevel?: string }).thinkingLevel || 'medium'

  // Build comprehensive context with source markers
  const contextStr = context
    .map(
      (c, i) =>
        `[SOURCE ${i + 1}]\nDocument: "${c.documentTitle}"\nType: ${c.documentType || 'Unknown'}\nPage: ${c.pageNumber || 'N/A'}\nRelevance: ${Math.round(c.similarity * 100)}%\nContent:\n${c.content}`
    )
    .join('\n\n' + '─'.repeat(50) + '\n\n')

  const systemPrompt = `${config.systemPrompt}

CONTEXT INFORMATION:
${extractedInfo.brand ? `- Detected Brand: ${extractedInfo.brand}` : ''}
${extractedInfo.serial ? `- Detected Serial: ${extractedInfo.serial}` : ''}
- Query Intent: ${intent}
- Thinking Level: ${thinkingLevel}

RESPONSE REQUIREMENTS:
1. Use ONLY information from the provided SOURCE documents
2. Cite every fact as [Source: Document Name, Page X]
3. If information isn't in sources, say "Not found in indexed documentation"
4. Show your reasoning for serial number decoding
5. Include confidence level based on source quality`

  const userPrompt = `User Question: ${query}

═══════════════════════════════════════════════════════════════
INDEXED DOCUMENTATION (${context.length} relevant sections found):
═══════════════════════════════════════════════════════════════

${contextStr}

═══════════════════════════════════════════════════════════════

Please answer the user's question using ONLY the information from the sources above.
- Cite your sources for every fact
- If you need more information, specify what document type would help
- Be precise with technical specifications`

  try {
    const response = await fetch(OPENROUTER_CHAT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
        'X-Title': 'HVAC Lookup Portal',
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        // Gemini 3 Flash specific parameters
        tools: HVAC_TOOLS,
        tool_choice: 'auto',
        // Provider-specific options for thinking level
        provider: {
          order: ['Google AI Studio', 'Google Vertex'],
          allow_fallbacks: true,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', errorText)
      return generateExtractiveResponse(context)
    }

    const data = await response.json()

    // Handle tool calls if present
    if (data.choices?.[0]?.message?.tool_calls) {
      return await handleToolCalls(data.choices[0].message.tool_calls, query, context, config)
    }

    return data.choices?.[0]?.message?.content || generateExtractiveResponse(context)
  } catch (error) {
    console.error('Gemini generation error:', error)
    return generateExtractiveResponse(context)
  }
}

/**
 * Handle tool calls from Gemini
 */
async function handleToolCalls(
  toolCalls: Array<{ function: { name: string; arguments: string } }>,
  originalQuery: string,
  context: RAGContext[],
  config: typeof AI_CONFIGS.general
): Promise<string> {
  const toolResults: Array<{ name: string; result: unknown }> = []

  for (const call of toolCalls) {
    const { name, arguments: argsStr } = call.function
    const args = JSON.parse(argsStr)

    switch (name) {
      case 'search_documents': {
        // Already have search results in context
        toolResults.push({
          name,
          result: {
            found: context.length,
            documents: context.map((c) => ({
              title: c.documentTitle,
              type: c.documentType,
              page: c.pageNumber,
              relevance: c.similarity,
            })),
          },
        })
        break
      }

      case 'get_document_content': {
        try {
          const content = await getDocumentContent(parseInt(args.documentId, 10))
          toolResults.push({
            name,
            result: { content: content.slice(0, 10000) }, // Limit for context
          })
        } catch {
          toolResults.push({
            name,
            result: { error: 'Document not found' },
          })
        }
        break
      }

      case 'decode_serial': {
        const result = decodeSerial({
          brand: args.brand,
          serial: args.serial,
          model: args.model,
        })
        toolResults.push({
          name,
          result,
        })
        break
      }
    }
  }

  // If decode_serial was called, format the result directly
  const decodeResult = toolResults.find((r) => r.name === 'decode_serial')
  if (decodeResult) {
    const result = decodeResult.result as {
      manufactureDate: string | null
      confidence: number
      explanation: string
      citations: Citation[]
      warnings: string[]
    }

    if (result.manufactureDate) {
      return `Based on the rule engine analysis:\n\n**${result.explanation}**\n\n**Confidence:** ${Math.round(result.confidence * 100)}%${
        result.warnings.length > 0 ? '\n\n**Notes:**\n' + result.warnings.map((w) => `• ${w}`).join('\n') : ''
      }\n\n*[Source: Serial decode rules database]*`
    }
  }

  // Fall back to extractive response
  return generateExtractiveResponse(context)
}

/**
 * Generate extractive response (fallback when LLM unavailable)
 */
function generateExtractiveResponse(context: RAGContext[]): string {
  if (context.length === 0) {
    return 'No relevant information found in the indexed documentation.'
  }

  const intro = `Based on the indexed documentation, here's what I found:\n\n`

  const content = context
    .slice(0, 3)
    .map((c) => {
      const excerpt = c.content.slice(0, 400) + (c.content.length > 400 ? '...' : '')
      const source = `[Source: ${c.documentTitle}${c.pageNumber ? `, Page ${c.pageNumber}` : ''}]`
      return `**From "${c.documentTitle}"** (${Math.round(c.similarity * 100)}% match)\n\n> ${excerpt}\n\n${source}`
    })
    .join('\n\n---\n\n')

  const outro = '\n\n*Please see the cited sources for full details. Click on citations to view the original documents.*'

  return intro + content + outro
}

/**
 * Convenience export
 */
export const ragChatbot = {
  processMessage: processRAGChat,
}
