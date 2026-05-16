import type { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import axios from 'axios'

/**
 * POST /store/shipping/calculate
 * Calculate shipping rates via RajaOngkir.
 *
 * Body: { destination: { city, province, postalCode }, items: [{ weight, quantity }] }
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const apiKey = process.env.RAJAONGKIR_API_KEY

  if (!apiKey) {
    return res.status(500).json({
      error: 'Shipping calculation not configured. Set RAJAONGKIR_API_KEY.',
    })
  }

  const { destination, items } = req.body as {
    destination: { city: string; province: string; postalCode: string }
    items: { weight: number; quantity: number }[]
  }

  if (!destination?.city || !items?.length) {
    return res.status(400).json({ error: 'destination and items are required' })
  }

  // Calculate total weight in grams
  const totalWeight = items.reduce((sum, item) => sum + (item.weight ?? 500) * item.quantity, 0)

  try {
    // RajaOngkir Starter API (free tier)
    const response = await axios.post(
      'https://api.rajaongkir.com/starter/cost',
      {
        origin: '152', // Jakarta (change to your warehouse city ID)
        destination: destination.city,
        weight: totalWeight,
        courier: 'jne:jnt:pos',
      },
      {
        headers: {
          key: apiKey,
          'Content-Type': 'application/json',
        },
      },
    )

    const results = response.data?.rajaongkir?.results ?? []
    const rates: { courier: string; service: string; price: number; estimatedDays: number }[] = []

    for (const courier of results) {
      for (const cost of courier.costs ?? []) {
        rates.push({
          courier: courier.code.toUpperCase(),
          service: cost.service,
          price: cost.cost?.[0]?.value ?? 0,
          estimatedDays: parseInt(cost.cost?.[0]?.etd ?? '0') || 3,
        })
      }
    }

    res.json({ rates })
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to calculate shipping',
      detail: error.response?.data ?? error.message,
    })
  }
}
