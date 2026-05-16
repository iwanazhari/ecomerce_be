import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'

export const EXPEDITION_MODULE = 'expedition'

/**
 * GET /admin/expeditions
 * List all expeditions with pagination
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const expeditionService = req.scope.resolve(EXPEDITION_MODULE)
  const { limit = 50, offset = 0, q, code, is_active } = req.query as any

  const filter: any = {}
  if (q) filter.$or = [
    { name: { $ilike: `%${q}%` } },
    { code: { $ilike: `%${q}%` } },
  ]
  if (code) filter.code = code
  if (is_active !== undefined) filter.is_active = is_active === 'true'

  const [expeditions, count] = await expeditionService.listAndCountExpeditions(filter, {
    skip: parseInt(offset),
    take: parseInt(limit),
  })

  res.json({
    expeditions,
    count,
    limit: parseInt(limit),
    offset: parseInt(offset),
  })
}

/**
 * POST /admin/expeditions
 * Create a new expedition
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const expeditionService = req.scope.resolve(EXPEDITION_MODULE)

  const expedition = await expeditionService.createExpeditions({
    name: req.body.name,
    code: req.body.code,
    tracking_url_template: req.body.tracking_url_template ?? null,
    is_active: req.body.is_active ?? true,
    description: req.body.description ?? null,
    flat_rate: req.body.flat_rate ?? 0,
    is_store_delivery: req.body.is_store_delivery ?? false,
  })

  res.status(201).json({ expedition })
}
