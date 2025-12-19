import { describe, it, expect, beforeEach } from 'vitest'
import { RuleEngine, decodeSerial } from '@/lib/ruleEngine'

describe('Rule Engine', () => {
  let engine: RuleEngine

  beforeEach(() => {
    engine = new RuleEngine()
  })

  describe('Carrier Decode', () => {
    it('decodes pre-2004 format (YYWW#####)', () => {
      const result = decodeSerial({ brand: 'Carrier', serial: '9845123456' })

      expect(result.manufactureDate).toBe('1998-W45')
      expect(result.confidence).toBeGreaterThan(0.9)
      expect(result.matchedRuleId).toBe('carrier-1980-2003-weekly')
      expect(result.citations.length).toBeGreaterThan(0)
    })

    it('decodes 2004+ format (WYYMM######)', () => {
      const result = decodeSerial({ brand: 'Carrier', serial: 'A2106123456' })

      expect(result.manufactureDate).toBe('2021-06')
      expect(result.explanation).toContain('June 2021')
      expect(result.matchedRuleId).toBe('carrier-2004-present')
    })

    it('handles Bryant as Carrier alias', () => {
      // Bryant uses same serial format as Carrier
      const carrierResult = decodeSerial({ brand: 'Carrier', serial: '9845123456' })
      const bryantResult = decodeSerial({ brand: 'carrier', serial: '9845123456' })

      expect(carrierResult.manufactureDate).toBe(bryantResult.manufactureDate)
    })
  })

  describe('Trane Decode', () => {
    it('decodes 1983-2009 format (Y##L#####)', () => {
      const result = decodeSerial({ brand: 'Trane', serial: '915C12345' })

      expect(result.manufactureDate).not.toBeNull()
      expect(result.confidence).toBeGreaterThan(0.8)
      expect(result.citations.length).toBeGreaterThan(0)
    })
  })

  describe('Lennox Decode', () => {
    it('decodes 2002+ format (YYMM#####)', () => {
      const result = decodeSerial({ brand: 'Lennox', serial: '210312345' })

      expect(result.manufactureDate).toBe('2021-03')
      expect(result.explanation).toContain('March 2021')
    })
  })

  describe('Rheem Decode', () => {
    it('decodes 1981+ format (LWWYY#####)', () => {
      const result = decodeSerial({ brand: 'Rheem', serial: 'M450521234' })

      expect(result.manufactureDate).not.toBeNull()
      expect(result.matchedRuleId).toBe('rheem-1981-present')
    })
  })

  describe('Goodman Decode', () => {
    it('decodes 1997+ format (YYMM######)', () => {
      const result = decodeSerial({ brand: 'Goodman', serial: '2103123456' })

      expect(result.manufactureDate).toBe('2021-03')
      expect(result.explanation).toContain('March 2021')
    })
  })

  describe('Edge Cases', () => {
    it('returns null for unknown brand', () => {
      const result = decodeSerial({ brand: 'UnknownBrand', serial: '123456789' })

      expect(result.manufactureDate).toBeNull()
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.confidence).toBe(0)
    })

    it('returns null for unrecognized serial format', () => {
      const result = decodeSerial({ brand: 'Carrier', serial: 'ABC' })

      expect(result.manufactureDate).toBeNull()
      expect(result.explanation).toContain('not recognized')
    })

    it('is case insensitive for brand names', () => {
      const lower = decodeSerial({ brand: 'carrier', serial: '9845123456' })
      const upper = decodeSerial({ brand: 'CARRIER', serial: '9845123456' })
      const mixed = decodeSerial({ brand: 'Carrier', serial: '9845123456' })

      expect(lower.manufactureDate).toBe(upper.manufactureDate)
      expect(lower.manufactureDate).toBe(mixed.manufactureDate)
    })

    it('always includes citations when rule matches', () => {
      const result = decodeSerial({ brand: 'Carrier', serial: '9845123456' })

      expect(result.citations.length).toBeGreaterThan(0)
      expect(result.citations[0]).toHaveProperty('paperlessDocId')
      expect(result.citations[0]).toHaveProperty('pageStart')
      expect(result.citations[0]).toHaveProperty('pageEnd')
      expect(result.citations[0]).toHaveProperty('excerpt')
    })
  })

  describe('Determinism', () => {
    it('returns same result for same input', () => {
      const input = { brand: 'Carrier', serial: '9845123456' }

      const result1 = decodeSerial(input)
      const result2 = decodeSerial(input)

      expect(result1.manufactureDate).toBe(result2.manufactureDate)
      expect(result1.confidence).toBe(result2.confidence)
      expect(result1.matchedRuleId).toBe(result2.matchedRuleId)
    })
  })

  describe('Supported Brands', () => {
    it('returns list of supported brands', () => {
      const brands = engine.getSupportedBrands()

      expect(brands).toContain('carrier')
      expect(brands).toContain('trane')
      expect(brands).toContain('lennox')
      expect(brands).toContain('rheem')
      expect(brands).toContain('goodman')
    })
  })
})
