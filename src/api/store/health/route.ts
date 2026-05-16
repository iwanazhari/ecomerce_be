import type { MedusaRequest, MedusaResponse } from '@medusajs/framework'

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.json({
    message: 'Waterpro API is running',
    timestamp: new Date().toISOString(),
  })
}
