import type { MedusaRequest, MedusaResponse } from '@medusajs/framework'

/**
 * POST /store/shipping/cheapest
 * Returns the cheapest shipping option.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  // Forward to calculate endpoint, then pick cheapest
  const calculateRoute = (await import('../calculate/route.js')) as any

  // Create a mock response capture
  const mockRes = {
    status: (code: number) => ({
      json: (data: any) => {
        if (code !== 200) return mockRes.status(code).json(data)
        const rates = data.rates ?? []
        if (rates.length === 0) {
          return { rate: null }
        }
        const cheapest = rates.sort((a: any, b: any) => a.price - b.price)[0]
        return { rate: cheapest }
      },
    }),
  }

  const result = await calculateRoute.POST(req, mockRes)
  res.json(result ?? { rate: null })
}
