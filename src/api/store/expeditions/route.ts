import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { EXPEDITION_MODULE } from './route'

/**
 * GET /store/expeditions
 * List all active expeditions (public endpoint for checkout)
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const expeditionService = req.scope.resolve(EXPEDITION_MODULE)

  // Only return active expeditions for public access
  const expeditions = await expeditionService.listExpeditions({
    is_active: true,
  })

  res.json({
    expeditions,
    count: expeditions.length,
  })
}
