import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'

export const PROVINCE_MODULE = 'province'

/**
 * GET /admin/provinces
 * List all provinces with pagination
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const provinceService = req.scope.resolve(PROVINCE_MODULE)
  const { limit = 100, offset = 0, q } = req.query as any

  const filter: any = {}
  if (q) filter.name = { $ilike: `%${q}%` }

  const [provinces, count] = await provinceService.listAndCountProvinces(filter, {
    skip: parseInt(offset),
    take: parseInt(limit),
    order: { name: 'ASC' },
  })

  res.json({
    provinces,
    count,
    limit: parseInt(limit),
    offset: parseInt(offset),
  })
}

/**
 * POST /admin/provinces
 * Create a new province
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const provinceService = req.scope.resolve(PROVINCE_MODULE)
  const body = req.body as any

  const province = await provinceService.createProvinces({
    name: body.name,
    code: body.code ?? null,
  })

  res.status(201).json({ province })
}
