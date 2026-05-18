/**
 * Seed Data for Expeditions
 * Common Indonesian courier services
 */

const { Pool } = require('pg')

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'medusa-v2',
  user: 'iwan',
  password: 'iwan',
})

const expeditions = [
  {
    name: 'JNE (Jalur Nugraha Ekakurir)',
    code: 'JNE',
    description: 'Jasa pengiriman paket terpercaya di Indonesia',
    tracking_url_template: 'https://www.jne.co.id/id/tracking?awb={{tracking_number}}',
    is_active: true,
    flat_rate: '15000',
    is_store_delivery: false,
  },
  {
    name: 'J&T Express',
    code: 'JNT',
    description: 'Pengiriman cepat dan amanah',
    tracking_url_template: 'https://jet.co.id/lacak?awb={{tracking_number}}',
    is_active: true,
    flat_rate: '14000',
    is_store_delivery: false,
  },
  {
    name: 'SiCepat Ekspres',
    code: 'SICEPAT',
    description: 'Layanan ekspres dengan pengiriman same-day',
    tracking_url_template: 'https://www.sicepat.com/lacak-kiriman?awb={{tracking_number}}',
    is_active: true,
    flat_rate: '16000',
    is_store_delivery: false,
  },
  {
    name: 'AnterAja',
    code: 'ANTERAJA',
    description: 'Solusi pengiriman praktis dan hemat',
    tracking_url_template: 'https://anteraja.id/tracking?awb={{tracking_number}}',
    is_active: true,
    flat_rate: '13000',
    is_store_delivery: false,
  },
  {
    name: 'Ninja Express',
    code: 'NINJA',
    description: 'Pengiriman reliable untuk e-commerce',
    tracking_url_template: 'https://www.ninjaxpress.co/id-id/tracking?awb={{tracking_number}}',
    is_active: true,
    flat_rate: '15000',
    is_store_delivery: false,
  },
  {
    name: 'ID Express (IDEXP)',
    code: 'IDEXP',
    description: 'Layanan pengiriman domestik terpercaya',
    tracking_url_template: 'https://idexpress.com/lacak?awb={{tracking_number}}',
    is_active: true,
    flat_rate: '14000',
    is_store_delivery: false,
  },
  {
    name: 'POS Indonesia',
    code: 'POS',
    description: 'Layanan pos nasional Indonesia',
    tracking_url_template: 'https://posindonesia.co.id/lacak-kiriman?awb={{tracking_number}}',
    is_active: true,
    flat_rate: '12000',
    is_store_delivery: false,
  },
  {
    name: 'Waterpro Delivery',
    code: 'WATERPRO_DELIVERY',
    description: 'Pengiriman langsung dari toko Waterpro (gratis ongkir)',
    tracking_url_template: null,
    is_active: true,
    flat_rate: '0',
    is_store_delivery: true,
  },
]

async function seed() {
  console.log('🌱 Starting expedition seed...\n')

  const client = await pool.connect()

  try {
    let created = 0
    let skipped = 0

    for (const exp of expeditions) {
      // Check if exists
      const checkResult = await client.query(
        'SELECT id FROM expedition WHERE code = $1',
        [exp.code]
      )

      if (checkResult.rows.length > 0) {
        console.log(`⏭️  Expedition ${exp.code} already exists`)
        skipped++
        continue
      }

      // Insert
      const id = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const now = new Date().toISOString()

      await client.query(
        `INSERT INTO expedition (
          id, name, code, description, tracking_url_template, 
          is_active, flat_rate, is_store_delivery, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          id,
          exp.name,
          exp.code,
          exp.description,
          exp.tracking_url_template,
          exp.is_active,
          exp.flat_rate,
          exp.is_store_delivery,
          now,
          now,
        ]
      )

      console.log(`✅ Created: ${exp.name} (${exp.code})`)
      created++
    }

    console.log('\n🎉 Seed completed!')
    console.log(`   Created: ${created} expeditions`)
    console.log(`   Skipped: ${skipped} expeditions`)
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

seed().catch(console.error)
