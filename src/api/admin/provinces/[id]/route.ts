import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'

export const PROVINCE_MODULE = 'province'

/**
 * GET /admin/provinces/[id]
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const provinceService = req.scope.resolve(PROVINCE_MODULE)
  const { id } = req.params

  try {
    const province = await provinceService.retrieveProvince(id)
    res.json({ province })
  } catch {
    res.status(404).json({ type: 'not_found', message: `Province not found: ${id}` })
  }
}

/**
 * POST /admin/provinces/[id]
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const provinceService = req.scope.resolve(PROVINCE_MODULE)
  const { id } = req.params
  const body = req.body as any

  try {
    const updateData: any = { id }
    if (body.name !== undefined) updateData.name = body.name
    if (body.code !== undefined) updateData.code = body.code

    const province = await provinceService.updateProvinces(updateData)
    res.json({ province })
  } catch {
    res.status(404).json({ type: 'not_found', message: `Province not found: ${id}` })
  }
}

/**
 * DELETE /admin/provinces/[id]
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const provinceService = req.scope.resolve(PROVINCE_MODULE)
  const { id } = req.params

  try {
    await provinceService.deleteProvinces(id)
    res.json({ id, deleted: true })
  } catch {
    res.status(404).json({ type: 'not_found', message: `Province not found: ${id}` })
  }
}
