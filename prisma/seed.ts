import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // ============================================================================
  // USERS
  // ============================================================================

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hvaclookup.com' },
    update: {},
    create: {
      email: 'admin@hvaclookup.com',
      name: 'Admin User',
      passwordHash: adminPassword,
      role: 'ADMIN',
      tier: 'ENTERPRISE',
    },
  })
  console.log(`Created admin user: ${admin.email}`)

  // Create test member user
  const memberPassword = await bcrypt.hash('member123', 12)
  const member = await prisma.user.upsert({
    where: { email: 'member@hvaclookup.com' },
    update: {},
    create: {
      email: 'member@hvaclookup.com',
      name: 'Test Member',
      passwordHash: memberPassword,
      role: 'MEMBER',
      tier: 'GOLD',
    },
  })
  console.log(`Created member user: ${member.email}`)

  // Create free user
  const freePassword = await bcrypt.hash('free123', 12)
  const freeUser = await prisma.user.upsert({
    where: { email: 'free@hvaclookup.com' },
    update: {},
    create: {
      email: 'free@hvaclookup.com',
      name: 'Free User',
      passwordHash: freePassword,
      role: 'FREE',
      tier: 'FREE',
    },
  })
  console.log(`Created free user: ${freeUser.email}`)

  // ============================================================================
  // DOCUMENT TYPES (Controlled vocabulary for document classification)
  // ============================================================================

  const documentTypes = [
    { code: 'DECODE_GUIDE', name: 'Serial Decode Guide', description: 'Documents explaining serial number formats and how to decode manufacture dates', priority: 10 },
    { code: 'SERVICE_MANUAL', name: 'Service Manual', description: 'Full repair and maintenance manuals for technicians', priority: 9 },
    { code: 'SPEC_SHEET', name: 'Specification Sheet', description: 'Product specifications, ratings, and dimensions', priority: 8 },
    { code: 'INSTALLATION', name: 'Installation Guide', description: 'Setup and installation instructions', priority: 7 },
    { code: 'WIRING_DIAGRAM', name: 'Wiring Diagram', description: 'Electrical schematics and wiring guides', priority: 6 },
    { code: 'PARTS_LIST', name: 'Parts List', description: 'Parts catalogs and component lists', priority: 5 },
    { code: 'TECH_BULLETIN', name: 'Technical Bulletin', description: 'Updates, recalls, and service advisories', priority: 4 },
    { code: 'USER_MANUAL', name: 'User Manual', description: 'End-user operation and maintenance guides', priority: 3 },
    { code: 'UNKNOWN', name: 'Unclassified', description: 'Documents pending classification', priority: 0 },
  ]

  for (const docType of documentTypes) {
    await prisma.documentType.upsert({
      where: { code: docType.code },
      update: docType,
      create: docType,
    })
  }
  console.log(`Created ${documentTypes.length} document types`)

  // ============================================================================
  // PRODUCT CATEGORIES (Hierarchical equipment classification)
  // ============================================================================

  // Root categories
  const hvacRoot = await prisma.productCategory.upsert({
    where: { slug: 'hvac' },
    update: {},
    create: { name: 'HVAC', slug: 'hvac', path: '/HVAC', level: 0 },
  })

  // Heating subcategories
  const heating = await prisma.productCategory.upsert({
    where: { slug: 'heating' },
    update: {},
    create: { name: 'Heating', slug: 'heating', path: '/HVAC/Heating', level: 1, parentId: hvacRoot.id },
  })

  await prisma.productCategory.upsert({
    where: { slug: 'furnaces' },
    update: {},
    create: { name: 'Furnaces', slug: 'furnaces', path: '/HVAC/Heating/Furnaces', level: 2, parentId: heating.id },
  })

  await prisma.productCategory.upsert({
    where: { slug: 'boilers' },
    update: {},
    create: { name: 'Boilers', slug: 'boilers', path: '/HVAC/Heating/Boilers', level: 2, parentId: heating.id },
  })

  // Cooling subcategories
  const cooling = await prisma.productCategory.upsert({
    where: { slug: 'cooling' },
    update: {},
    create: { name: 'Cooling', slug: 'cooling', path: '/HVAC/Cooling', level: 1, parentId: hvacRoot.id },
  })

  await prisma.productCategory.upsert({
    where: { slug: 'air-conditioners' },
    update: {},
    create: { name: 'Air Conditioners', slug: 'air-conditioners', path: '/HVAC/Cooling/Air Conditioners', level: 2, parentId: cooling.id },
  })

  await prisma.productCategory.upsert({
    where: { slug: 'heat-pumps' },
    update: {},
    create: { name: 'Heat Pumps', slug: 'heat-pumps', path: '/HVAC/Cooling/Heat Pumps', level: 2, parentId: cooling.id },
  })

  // Air Quality
  const airQuality = await prisma.productCategory.upsert({
    where: { slug: 'air-quality' },
    update: {},
    create: { name: 'Air Quality', slug: 'air-quality', path: '/HVAC/Air Quality', level: 1, parentId: hvacRoot.id },
  })

  await prisma.productCategory.upsert({
    where: { slug: 'dehumidifiers' },
    update: {},
    create: { name: 'Dehumidifiers', slug: 'dehumidifiers', path: '/HVAC/Air Quality/Dehumidifiers', level: 2, parentId: airQuality.id },
  })

  await prisma.productCategory.upsert({
    where: { slug: 'air-handlers' },
    update: {},
    create: { name: 'Air Handlers', slug: 'air-handlers', path: '/HVAC/Air Quality/Air Handlers', level: 2, parentId: airQuality.id },
  })

  // Controls
  const controls = await prisma.productCategory.upsert({
    where: { slug: 'controls' },
    update: {},
    create: { name: 'Controls', slug: 'controls', path: '/HVAC/Controls', level: 1, parentId: hvacRoot.id },
  })

  await prisma.productCategory.upsert({
    where: { slug: 'thermostats' },
    update: {},
    create: { name: 'Thermostats', slug: 'thermostats', path: '/HVAC/Controls/Thermostats', level: 2, parentId: controls.id },
  })

  console.log('Created product category hierarchy')

  // ============================================================================
  // MANUFACTURERS & BRANDS
  // ============================================================================

  // Carrier Global
  const carrierGlobal = await prisma.manufacturer.upsert({
    where: { name: 'Carrier Global' },
    update: {},
    create: { name: 'Carrier Global', website: 'https://www.carrier.com' },
  })

  await prisma.brand.upsert({
    where: { slug: 'carrier' },
    update: { manufacturerId: carrierGlobal.id },
    create: {
      name: 'Carrier',
      slug: 'carrier',
      manufacturerId: carrierGlobal.id,
      aliases: JSON.stringify(['Carrier', 'CARRIER']),
    },
  })

  await prisma.brand.upsert({
    where: { slug: 'bryant' },
    update: { manufacturerId: carrierGlobal.id },
    create: {
      name: 'Bryant',
      slug: 'bryant',
      manufacturerId: carrierGlobal.id,
      aliases: JSON.stringify(['Bryant', 'BRYANT']),
    },
  })

  await prisma.brand.upsert({
    where: { slug: 'payne' },
    update: { manufacturerId: carrierGlobal.id },
    create: {
      name: 'Payne',
      slug: 'payne',
      manufacturerId: carrierGlobal.id,
      aliases: JSON.stringify(['Payne', 'PAYNE']),
    },
  })

  // Trane Technologies
  const traneTech = await prisma.manufacturer.upsert({
    where: { name: 'Trane Technologies' },
    update: {},
    create: { name: 'Trane Technologies', website: 'https://www.tranetechnologies.com' },
  })

  await prisma.brand.upsert({
    where: { slug: 'trane' },
    update: { manufacturerId: traneTech.id },
    create: {
      name: 'Trane',
      slug: 'trane',
      manufacturerId: traneTech.id,
      aliases: JSON.stringify(['Trane', 'TRANE']),
    },
  })

  await prisma.brand.upsert({
    where: { slug: 'american-standard' },
    update: { manufacturerId: traneTech.id },
    create: {
      name: 'American Standard',
      slug: 'american-standard',
      manufacturerId: traneTech.id,
      aliases: JSON.stringify(['American Standard', 'AMERICAN STANDARD']),
    },
  })

  // Lennox International
  const lennoxIntl = await prisma.manufacturer.upsert({
    where: { name: 'Lennox International' },
    update: {},
    create: { name: 'Lennox International', website: 'https://www.lennoxinternational.com' },
  })

  await prisma.brand.upsert({
    where: { slug: 'lennox' },
    update: { manufacturerId: lennoxIntl.id },
    create: {
      name: 'Lennox',
      slug: 'lennox',
      manufacturerId: lennoxIntl.id,
      aliases: JSON.stringify(['Lennox', 'LENNOX']),
    },
  })

  // Rheem
  const rheemMfg = await prisma.manufacturer.upsert({
    where: { name: 'Rheem Manufacturing' },
    update: {},
    create: { name: 'Rheem Manufacturing', website: 'https://www.rheem.com' },
  })

  await prisma.brand.upsert({
    where: { slug: 'rheem' },
    update: { manufacturerId: rheemMfg.id },
    create: {
      name: 'Rheem',
      slug: 'rheem',
      manufacturerId: rheemMfg.id,
      aliases: JSON.stringify(['Rheem', 'RHEEM']),
    },
  })

  await prisma.brand.upsert({
    where: { slug: 'ruud' },
    update: { manufacturerId: rheemMfg.id },
    create: {
      name: 'Ruud',
      slug: 'ruud',
      manufacturerId: rheemMfg.id,
      aliases: JSON.stringify(['Ruud', 'RUUD']),
    },
  })

  // Bosch
  const boschThermo = await prisma.manufacturer.upsert({
    where: { name: 'Bosch Thermotechnology' },
    update: {},
    create: { name: 'Bosch Thermotechnology', website: 'https://www.bosch-thermotechnology.com' },
  })

  await prisma.brand.upsert({
    where: { slug: 'bosch' },
    update: { manufacturerId: boschThermo.id },
    create: {
      name: 'Bosch',
      slug: 'bosch',
      manufacturerId: boschThermo.id,
      aliases: JSON.stringify(['Bosch', 'BOSCH']),
    },
  })

  await prisma.brand.upsert({
    where: { slug: 'buderus' },
    update: { manufacturerId: boschThermo.id },
    create: {
      name: 'Buderus',
      slug: 'buderus',
      manufacturerId: boschThermo.id,
      aliases: JSON.stringify(['Buderus', 'BUDERUS']),
    },
  })

  // Weil-McLain
  const weilMclain = await prisma.manufacturer.upsert({
    where: { name: 'Weil-McLain' },
    update: {},
    create: { name: 'Weil-McLain', website: 'https://www.weil-mclain.com' },
  })

  await prisma.brand.upsert({
    where: { slug: 'weil-mclain' },
    update: { manufacturerId: weilMclain.id },
    create: {
      name: 'Weil-McLain',
      slug: 'weil-mclain',
      manufacturerId: weilMclain.id,
      aliases: JSON.stringify(['Weil-McLain', 'WEIL-MCLAIN', 'Weil McLain']),
    },
  })

  console.log('Created manufacturers and brands')

  // ============================================================================
  // TAGS
  // ============================================================================

  const tags = [
    // Equipment types
    { name: 'furnace', category: 'equipment_type' },
    { name: 'heat_pump', category: 'equipment_type' },
    { name: 'air_conditioner', category: 'equipment_type' },
    { name: 'boiler', category: 'equipment_type' },
    { name: 'thermostat', category: 'equipment_type' },
    { name: 'air_handler', category: 'equipment_type' },
    // Fuel types
    { name: 'gas', category: 'fuel_type' },
    { name: 'electric', category: 'fuel_type' },
    { name: 'oil', category: 'fuel_type' },
    { name: 'dual_fuel', category: 'fuel_type' },
    // Features
    { name: 'modulating', category: 'feature' },
    { name: 'two_stage', category: 'feature' },
    { name: 'single_stage', category: 'feature' },
    { name: 'variable_speed', category: 'feature' },
    { name: 'inverter', category: 'feature' },
    { name: 'condensing', category: 'feature' },
  ]

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { name: tag.name },
      update: tag,
      create: tag,
    })
  }
  console.log(`Created ${tags.length} tags`)

  console.log('')
  console.log('Seeding complete!')
  console.log('')
  console.log('Test accounts:')
  console.log('  Admin:  admin@hvaclookup.com / admin123')
  console.log('  Member: member@hvaclookup.com / member123')
  console.log('  Free:   free@hvaclookup.com / free123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
