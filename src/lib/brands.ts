/**
 * Brand data for the brand index
 * In production, this would come from the database
 */

export interface Brand {
  id: string
  name: string
  slug: string
  aliases: string[]
  parentCompany: string | null
  description: string
  serialFormats: SerialFormat[]
  examples: SerialExample[]
}

export interface SerialFormat {
  era: string
  pattern: string
  description: string
}

export interface SerialExample {
  serial: string
  manufactureDate: string
  notes: string
}

export const brands: Brand[] = [
  {
    id: 'carrier',
    name: 'Carrier',
    slug: 'carrier',
    aliases: ['Bryant', 'Payne', 'Day & Night', 'Heil', 'Tempstar', 'Arcoaire', 'Comfortmaker', 'Keeprite'],
    parentCompany: 'Carrier Global Corporation',
    description: 'Carrier is one of the world\'s leading HVAC manufacturers, founded by Willis Carrier who invented modern air conditioning in 1902.',
    serialFormats: [
      {
        era: '1980-2003',
        pattern: 'YYWW#####',
        description: 'First 2 digits = year (add 1900), next 2 = week',
      },
      {
        era: '2004-present',
        pattern: 'WYYMM######',
        description: 'Position 2-3 = year (add 2000), position 4-5 = month',
      },
    ],
    examples: [
      { serial: '9845123456', manufactureDate: '1998, Week 45', notes: 'Pre-2004 format' },
      { serial: 'A2106123456', manufactureDate: 'June 2021', notes: '2004+ format' },
    ],
  },
  {
    id: 'trane',
    name: 'Trane',
    slug: 'trane',
    aliases: ['American Standard'],
    parentCompany: 'Trane Technologies',
    description: 'Trane is a major American HVAC manufacturer known for residential and commercial heating, ventilation, and air conditioning systems.',
    serialFormats: [
      {
        era: '1983-2009',
        pattern: 'Y##L#####',
        description: 'First digit = year (0-9 cycle), next 2 = week, letter = plant',
      },
      {
        era: '2010-present',
        pattern: '###YL#####',
        description: '4th digit = year (0-9 from 2010)',
      },
    ],
    examples: [
      { serial: '915C12345', manufactureDate: '1999 or 2009, Week 15', notes: 'Decade requires context' },
      { serial: '1234A56789', manufactureDate: '2014', notes: '2010+ format' },
    ],
  },
  {
    id: 'lennox',
    name: 'Lennox',
    slug: 'lennox',
    aliases: ['Armstrong', 'Ducane', 'Aire-Flo'],
    parentCompany: 'Lennox International',
    description: 'Lennox International is a leading provider of climate control solutions for heating, air conditioning, and refrigeration.',
    serialFormats: [
      {
        era: '1974-2001',
        pattern: 'YM##-#####',
        description: 'First digit = year (add 1970), second = month (1-9, 0=Oct, A=Nov, B=Dec)',
      },
      {
        era: '2002-present',
        pattern: 'YYMM#####',
        description: 'First 2 digits = year (add 2000), next 2 = month',
      },
    ],
    examples: [
      { serial: '5612-12345', manufactureDate: 'December 1985', notes: 'Pre-2002 format' },
      { serial: '210312345', manufactureDate: 'March 2021', notes: '2002+ format' },
    ],
  },
  {
    id: 'rheem',
    name: 'Rheem',
    slug: 'rheem',
    aliases: ['Ruud', 'WeatherKing', 'Thermal Zone'],
    parentCompany: 'Rheem Manufacturing Company',
    description: 'Rheem is a leading manufacturer of water heaters, air conditioners, and furnaces for residential and commercial use.',
    serialFormats: [
      {
        era: '1981-present',
        pattern: 'LWWYY#####',
        description: 'Letter prefix, positions 2-3 = week, 4-5 = year',
      },
    ],
    examples: [
      { serial: 'M450521234', manufactureDate: 'Week 45, 2005', notes: 'Standard format' },
    ],
  },
  {
    id: 'goodman',
    name: 'Goodman',
    slug: 'goodman',
    aliases: ['Amana', 'Daikin'],
    parentCompany: 'Daikin Industries',
    description: 'Goodman Manufacturing is known for affordable, reliable HVAC systems. Now part of Daikin, the world\'s largest HVAC manufacturer.',
    serialFormats: [
      {
        era: '1997-present',
        pattern: 'YYMM######',
        description: 'First 2 digits = year, next 2 = month',
      },
    ],
    examples: [
      { serial: '2103123456', manufactureDate: 'March 2021', notes: 'Standard format' },
    ],
  },
  {
    id: 'york',
    name: 'York',
    slug: 'york',
    aliases: ['Coleman', 'Luxaire', 'Champion', 'Fraser-Johnston'],
    parentCompany: 'Johnson Controls',
    description: 'York is one of the oldest HVAC brands, now part of Johnson Controls. Known for both residential and commercial systems.',
    serialFormats: [
      {
        era: '2004-present',
        pattern: 'WYYWW#####',
        description: 'Letter = plant, positions 2-3 = year, 4-5 = week',
      },
    ],
    examples: [
      { serial: 'W2115123456', manufactureDate: 'Week 15, 2021', notes: '2004+ format' },
    ],
  },
]

export function getBrandBySlug(slug: string): Brand | undefined {
  return brands.find((b) => b.slug === slug)
}

export function getBrandById(id: string): Brand | undefined {
  return brands.find((b) => b.id === id)
}

export function searchBrands(query: string): Brand[] {
  const q = query.toLowerCase()
  return brands.filter(
    (b) =>
      b.name.toLowerCase().includes(q) ||
      b.aliases.some((a) => a.toLowerCase().includes(q))
  )
}

export function getBrandsAlphabetical(): Map<string, Brand[]> {
  const grouped = new Map<string, Brand[]>()

  // Sort brands alphabetically
  const sortedBrands = [...brands].sort((a, b) => a.name.localeCompare(b.name))

  for (const brand of sortedBrands) {
    const letter = brand.name[0].toUpperCase()
    if (!grouped.has(letter)) {
      grouped.set(letter, [])
    }
    grouped.get(letter)!.push(brand)
  }

  return grouped
}
