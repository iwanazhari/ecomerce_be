import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'

export const PROVINCE_MODULE = 'province'

/**
 * GET /store/provinces
 * List all provinces (public, no auth required)
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const provinceService = req.scope.resolve(PROVINCE_MODULE)

  const [provinces, count] = await provinceService.listAndCountProvinces({}, {
    order: { name: 'ASC' },
  })

  res.json({
    provinces,
    count,
  })
}
