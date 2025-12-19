import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Chatbot } from '@/lib/chatbot'

// Mock the Paperless client
vi.mock('@/lib/paperless/client', () => ({
  searchDocuments: vi.fn(),
}))

import { searchDocuments } from '@/lib/paperless/client'

describe('Chatbot Citation Requirement', () => {
  let chatbot: Chatbot

  beforeEach(() => {
    chatbot = new Chatbot()
    vi.clearAllMocks()
  })

  describe('Citation-Locked Behavior', () => {
    it('includes citations for decode responses', async () => {
      const response = await chatbot.processMessage(
        'Decode serial 9845123456 for Carrier'
      )

      expect(response.citations).toBeDefined()
      expect(response.citations.length).toBeGreaterThan(0)
      expect(response.type).toBe('decode')
    })

    it('includes citations when documents are found', async () => {
      // Mock search returning results
      vi.mocked(searchDocuments).mockResolvedValueOnce({
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            id: 123,
            title: 'Carrier Installation Manual',
            content: 'Test content',
            created: '2024-01-01',
            added: '2024-01-01',
            modified: '2024-01-01',
            correspondent: null,
            document_type: null,
            storage_path: null,
            tags: [],
            archive_serial_number: null,
            original_file_name: 'test.pdf',
            page_count: 10,
            __search_hit__: {
              score: 0.95,
              highlights: 'The refrigerant type for this model is R-410A.',
              note_highlights: '',
              rank: 1,
            },
          },
        ],
      })

      const response = await chatbot.processMessage(
        'What refrigerant does Carrier use?'
      )

      expect(response.citations.length).toBeGreaterThan(0)
      expect(response.type).toBe('search')
    })

    it('returns no_results type when no documents found', async () => {
      // Mock search returning no results
      vi.mocked(searchDocuments).mockResolvedValueOnce({
        count: 0,
        next: null,
        previous: null,
        results: [],
      })

      const response = await chatbot.processMessage(
        'Tell me about a fake brand XYZ123'
      )

      expect(response.type).toBe('no_results')
      expect(response.message).toContain('could not find')
    })

    it('explicitly refuses when no evidence is found', async () => {
      vi.mocked(searchDocuments).mockResolvedValueOnce({
        count: 0,
        next: null,
        previous: null,
        results: [],
      })

      const response = await chatbot.processMessage(
        'What is the warranty on a 2020 Carrier unit?'
      )

      expect(response.citations).toEqual([])
      expect(response.message).toMatch(
        /could not find|no.*information|try.*rephrasing/i
      )
    })
  })

  describe('Intent Detection', () => {
    it('detects decode intent with "decode" keyword', async () => {
      const response = await chatbot.processMessage(
        'Please decode serial 9845123456 for Carrier'
      )

      expect(response.type).toBe('decode')
    })

    it('detects decode intent with "how old" phrase', async () => {
      const response = await chatbot.processMessage(
        'How old is my Carrier unit with serial 9845123456?'
      )

      expect(response.type).toBe('decode')
    })

    it('detects decode intent with "manufacture date" phrase', async () => {
      const response = await chatbot.processMessage(
        'What is the manufacture date for Carrier 9845123456?'
      )

      expect(response.type).toBe('decode')
    })

    it('falls back to search for general questions', async () => {
      vi.mocked(searchDocuments).mockResolvedValueOnce({
        count: 0,
        next: null,
        previous: null,
        results: [],
      })

      const response = await chatbot.processMessage(
        'What are the efficiency ratings for heat pumps?'
      )

      expect(response.type).toBe('no_results')
      expect(searchDocuments).toHaveBeenCalled()
    })
  })

  describe('Citation Structure', () => {
    it('citations have required fields', async () => {
      const response = await chatbot.processMessage(
        'Decode Carrier serial 9845123456'
      )

      for (const citation of response.citations) {
        expect(citation).toHaveProperty('paperlessDocId')
        expect(citation).toHaveProperty('pageStart')
        expect(citation).toHaveProperty('pageEnd')
        expect(citation).toHaveProperty('excerpt')
        expect(typeof citation.excerpt).toBe('string')
        expect(citation.excerpt.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Supported Brands', () => {
    it('returns list of supported brands', () => {
      const brands = chatbot.getSupportedBrands()

      expect(Array.isArray(brands)).toBe(true)
      expect(brands.length).toBeGreaterThan(0)
    })
  })
})
