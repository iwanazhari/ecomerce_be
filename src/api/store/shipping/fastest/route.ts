import type { MedusaRequest, MedusaResponse } from '@medusajs/framework'

/**
 * POST /store/shipping/fastest
 * Returns the fastest shipping option.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const calculateRoute = (await import('../calculate/route.js')) as any

  const mockRes = {
    status: (code: number) => ({
      json: (data: any) => {
        if (code !== 200) return mockRes.status(code).json(data)
        const rates = data.rates ?? []
        if (rates.length === 0) {
          return { rate: null }
        }
        const fastest = rates.sort((a: any, b: any) => a.estimatedDays - b.estimatedDays)[0]
        return { rate: fastest }
      },
    }),
  }

  const result = await calculateRoute.POST(req, mockRes)
  res.json(result ?? { rate: null })
}
