import { DecodeResult, DecodeInput, Citation } from '@/types'

/**
 * Decode instructions for extracting manufacture date from serial numbers
 */
interface DecodeInstruction {
  type: 'year_digit' | 'year_letter' | 'month_digit' | 'month_letter' | 'week' | 'sequence'
  position: number | [number, number] // single position or range
  yearBase?: number // e.g., 1990 for single digit year
  yearMap?: Record<string, number> // letter to year mapping
  monthMap?: Record<string, number> // letter/digit to month mapping
}

interface RuleDefinition {
  id: string
  brandId: string
  name: string
  regex: string
  decodeInstructions: DecodeInstruction[]
  confidenceDefault: number
  citations: Citation[]
}

/**
 * Rule Engine for decoding HVAC serial numbers
 *
 * This is a deterministic engine - given the same input and rules,
 * it will always produce the same output.
 */
export class RuleEngine {
  private rules: Map<string, RuleDefinition[]> = new Map()

  constructor() {
    // Initialize with built-in rules
    this.loadBuiltInRules()
  }

  /**
   * Load rules from database or built-in definitions
   */
  loadBuiltInRules() {
    // Carrier/Bryant/Payne (UTC brands)
    this.addRules('carrier', [
      {
        id: 'carrier-1980-2003-weekly',
        brandId: 'carrier',
        name: 'Carrier Weekly Format (1980-2003)',
        regex: '^(\\d{4})(\\d{2})(\\d{5})$',
        // Format: YYWW##### (Year, Week, Sequence)
        decodeInstructions: [
          { type: 'year_digit', position: [0, 2], yearBase: 1900 },
          { type: 'week', position: [2, 4] },
        ],
        confidenceDefault: 0.95,
        citations: [
          {
            paperlessDocId: 'carrier-serial-guide-2020',
            pageStart: 3,
            pageEnd: 5,
            excerpt: 'Pre-2004 units: First 2 digits = year (add to 1900), next 2 digits = week of manufacture',
          },
        ],
      },
      {
        id: 'carrier-2004-present',
        brandId: 'carrier',
        name: 'Carrier Format (2004+)',
        regex: '^([A-Z])(\\d{2})(\\d{2})(\\d{6})$',
        // Format: WYYMM###### (Week letter, Year, Month, Sequence)
        decodeInstructions: [
          { type: 'year_digit', position: [1, 3], yearBase: 2000 },
          { type: 'month_digit', position: [3, 5] },
        ],
        confidenceDefault: 0.95,
        citations: [
          {
            paperlessDocId: 'carrier-serial-guide-2020',
            pageStart: 6,
            pageEnd: 7,
            excerpt: '2004 and newer: Position 2-3 = year (add 2000), position 4-5 = month',
          },
        ],
      },
    ])

    // Trane/American Standard
    this.addRules('trane', [
      {
        id: 'trane-1983-2009',
        brandId: 'trane',
        name: 'Trane Format (1983-2009)',
        regex: '^(\\d)(\\d{2})([A-Z])(\\d{5})$',
        // Format: Y##L##### (Year digit, Week, Plant, Sequence)
        decodeInstructions: [
          {
            type: 'year_digit',
            position: 0,
            yearBase: 1980, // 0=1980, 1=1981... 9=1989, then wraps
          },
          { type: 'week', position: [1, 3] },
        ],
        confidenceDefault: 0.85,
        citations: [
          {
            paperlessDocId: 'trane-serial-guide',
            pageStart: 2,
            pageEnd: 3,
            excerpt: 'First digit represents year: 0=1980 or 1990 or 2000, 1=1981 or 1991 or 2001, etc.',
          },
        ],
      },
      {
        id: 'trane-2010-present',
        brandId: 'trane',
        name: 'Trane Format (2010+)',
        regex: '^(\\d{3})(\\d)([A-Z])(\\d{5})$',
        // Format: ###YL##### (Sequence, Year, Plant, Sequence)
        decodeInstructions: [
          {
            type: 'year_digit',
            position: 3,
            yearBase: 2010,
          },
        ],
        confidenceDefault: 0.9,
        citations: [
          {
            paperlessDocId: 'trane-serial-guide',
            pageStart: 4,
            pageEnd: 4,
            excerpt: '2010+ format: 4th digit indicates year (0=2010, 1=2011, etc.)',
          },
        ],
      },
    ])

    // Lennox
    this.addRules('lennox', [
      {
        id: 'lennox-1974-2001',
        brandId: 'lennox',
        name: 'Lennox Format (1974-2001)',
        regex: '^(\\d)(\\d)(\\d{2})-(\\d{5})$',
        // Format: YM##-##### (Year, Month, Week, Sequence)
        decodeInstructions: [
          { type: 'year_digit', position: 0, yearBase: 1970 },
          {
            type: 'month_digit',
            position: 1,
            monthMap: {
              '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
              '7': 7, '8': 8, '9': 9, '0': 10, 'A': 11, 'B': 12,
            },
          },
        ],
        confidenceDefault: 0.85,
        citations: [
          {
            paperlessDocId: 'lennox-decoding-guide',
            pageStart: 1,
            pageEnd: 2,
            excerpt: 'First digit = year (add 1970), second digit = month (1-9, 0=Oct, A=Nov, B=Dec)',
          },
        ],
      },
      {
        id: 'lennox-2002-present',
        brandId: 'lennox',
        name: 'Lennox Format (2002+)',
        regex: '^(\\d{4})(\\d{2})(\\d{5})$',
        // Format: YYMM##### (Year, Month, Sequence)
        decodeInstructions: [
          { type: 'year_digit', position: [0, 2], yearBase: 2000 },
          { type: 'month_digit', position: [2, 4] },
        ],
        confidenceDefault: 0.95,
        citations: [
          {
            paperlessDocId: 'lennox-decoding-guide',
            pageStart: 3,
            pageEnd: 3,
            excerpt: '2002 onward: First 2 digits = year (add 2000), next 2 = month',
          },
        ],
      },
    ])

    // Rheem/Ruud
    this.addRules('rheem', [
      {
        id: 'rheem-1981-present',
        brandId: 'rheem',
        name: 'Rheem/Ruud Format (1981+)',
        regex: '^([A-Z])(\\d{2})(\\d{2})(\\d{5})$',
        // Format: LWWYYXXXXX (Letter, Week, Year, Sequence)
        decodeInstructions: [
          { type: 'week', position: [1, 3] },
          { type: 'year_digit', position: [3, 5], yearBase: 1900 },
        ],
        confidenceDefault: 0.9,
        citations: [
          {
            paperlessDocId: 'rheem-serial-guide',
            pageStart: 1,
            pageEnd: 2,
            excerpt: 'Position 2-3 = week of year, position 4-5 = year (add 1900 or 2000 depending on context)',
          },
        ],
      },
    ])

    // Goodman/Amana
    this.addRules('goodman', [
      {
        id: 'goodman-1997-present',
        brandId: 'goodman',
        name: 'Goodman/Amana Format (1997+)',
        regex: '^(\\d{2})(\\d{2})(\\d{6})$',
        // Format: YYMM###### (Year, Month, Sequence)
        decodeInstructions: [
          { type: 'year_digit', position: [0, 2], yearBase: 1900 },
          { type: 'month_digit', position: [2, 4] },
        ],
        confidenceDefault: 0.95,
        citations: [
          {
            paperlessDocId: 'goodman-serial-format',
            pageStart: 1,
            pageEnd: 1,
            excerpt: 'First 2 digits = year, next 2 digits = month',
          },
        ],
      },
    ])
  }

  /**
   * Add rules for a brand
   */
  addRules(brandId: string, rules: RuleDefinition[]) {
    const existing = this.rules.get(brandId) || []
    this.rules.set(brandId, [...existing, ...rules])
  }

  /**
   * Get all rules for a brand
   */
  getRulesForBrand(brandId: string): RuleDefinition[] {
    return this.rules.get(brandId.toLowerCase()) || []
  }

  /**
   * Decode a serial number
   */
  decode(input: DecodeInput): DecodeResult {
    const { brand, serial } = input
    const brandId = brand.toLowerCase()

    // Get rules for brand
    const brandRules = this.getRulesForBrand(brandId)

    if (brandRules.length === 0) {
      return {
        manufactureDate: null,
        confidence: 0,
        explanation: `No decoding rules found for brand: ${brand}`,
        matchedRuleId: null,
        citations: [],
        warnings: [`Brand "${brand}" is not in our database. Consider submitting this brand.`],
      }
    }

    // Try each rule
    for (const rule of brandRules) {
      const regex = new RegExp(rule.regex)
      const match = serial.match(regex)

      if (match) {
        const result = this.applyRule(rule, match, serial)
        if (result) {
          return result
        }
      }
    }

    // No rule matched
    return {
      manufactureDate: null,
      confidence: 0,
      explanation: `Serial number format not recognized for ${brand}`,
      matchedRuleId: null,
      citations: brandRules.flatMap(r => r.citations),
      warnings: [
        `Could not decode "${serial}" for ${brand}. This may be an unusual format.`,
        'Please verify the serial number is correct or submit for manual review.',
      ],
    }
  }

  /**
   * Apply a matching rule to extract the manufacture date
   */
  private applyRule(
    rule: RuleDefinition,
    match: RegExpMatchArray,
    serial: string
  ): DecodeResult | null {
    let year: number | null = null
    let month: number | null = null
    let week: number | null = null
    const warnings: string[] = []

    for (const instruction of rule.decodeInstructions) {
      const value = this.extractValue(serial, instruction.position)

      switch (instruction.type) {
        case 'year_digit': {
          const yearValue = parseInt(value, 10)
          if (instruction.yearBase) {
            // Handle decade wrapping
            if (value.length === 1) {
              // Single digit year - need to determine decade
              const baseDecade = Math.floor(instruction.yearBase / 10) * 10
              year = baseDecade + yearValue
              // If result is in the future, subtract 10
              if (year > new Date().getFullYear()) {
                year -= 10
              }
              warnings.push(`Single-digit year decoded as ${year}. Decade may need verification.`)
            } else {
              year = instruction.yearBase + yearValue
            }
          }
          break
        }

        case 'year_letter': {
          if (instruction.yearMap && instruction.yearMap[value]) {
            year = instruction.yearMap[value]
          }
          break
        }

        case 'month_digit': {
          if (instruction.monthMap) {
            month = instruction.monthMap[value]
          } else {
            month = parseInt(value, 10)
          }
          if (month && (month < 1 || month > 12)) {
            warnings.push(`Invalid month value: ${month}`)
            month = null
          }
          break
        }

        case 'month_letter': {
          if (instruction.monthMap && instruction.monthMap[value]) {
            month = instruction.monthMap[value]
          }
          break
        }

        case 'week': {
          week = parseInt(value, 10)
          if (week < 1 || week > 53) {
            warnings.push(`Invalid week value: ${week}`)
            week = null
          }
          break
        }
      }
    }

    if (!year) {
      return null
    }

    // Format the manufacture date
    let manufactureDate: string
    let explanation: string

    if (month) {
      manufactureDate = `${year}-${month.toString().padStart(2, '0')}`
      explanation = `Manufactured in ${this.getMonthName(month)} ${year}`
    } else if (week) {
      manufactureDate = `${year}-W${week.toString().padStart(2, '0')}`
      explanation = `Manufactured in Week ${week} of ${year}`
    } else {
      manufactureDate = year.toString()
      explanation = `Manufactured in ${year}`
    }

    return {
      manufactureDate,
      confidence: rule.confidenceDefault,
      explanation,
      matchedRuleId: rule.id,
      citations: rule.citations,
      warnings,
    }
  }

  /**
   * Extract value from serial at given position(s)
   */
  private extractValue(serial: string, position: number | [number, number]): string {
    if (typeof position === 'number') {
      return serial[position] || ''
    }
    return serial.slice(position[0], position[1])
  }

  /**
   * Get month name from number
   */
  private getMonthName(month: number): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ]
    return months[month - 1] || ''
  }

  /**
   * Get all supported brands
   */
  getSupportedBrands(): string[] {
    return Array.from(this.rules.keys())
  }
}

// Singleton instance
export const ruleEngine = new RuleEngine()

/**
 * Convenience function to decode a serial number
 */
export function decodeSerial(input: DecodeInput): DecodeResult {
  return ruleEngine.decode(input)
}
