import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'

export const EXPEDITION_MODULE = 'expedition'

/**
 * GET /admin/expeditions/[id]
 * Get a single expedition by ID
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const expeditionService = req.scope.resolve(EXPEDITION_MODULE)
  const { id } = req.params

  try {
    const expedition = await expeditionService.retrieveExpedition(id)
    res.json({ expedition })
  } catch (error: any) {
    res.status(404).json({ type: 'not_found', message: `Expedition not found: ${id}` })
  }
}

/**
 * POST /admin/expeditions/[id]
 * Update an expedition
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const expeditionService = req.scope.resolve(EXPEDITION_MODULE)
  const { id } = req.params

  try {
    const updateData: any = { id }
    if (req.body.name !== undefined) updateData.name = req.body.name
    if (req.body.code !== undefined) updateData.code = req.body.code
    if (req.body.tracking_url_template !== undefined) updateData.tracking_url_template = req.body.tracking_url_template
    if (req.body.is_active !== undefined) updateData.is_active = req.body.is_active
    if (req.body.description !== undefined) updateData.description = req.body.description
    if (req.body.flat_rate !== undefined) updateData.flat_rate = req.body.flat_rate
    if (req.body.is_store_delivery !== undefined) updateData.is_store_delivery = req.body.is_store_delivery

    const expedition = await expeditionService.updateExpeditions(updateData)
    res.json({ expedition })
  } catch (error: any) {
    res.status(404).json({ type: 'not_found', message: `Expedition not found: ${id}` })
  }
}

/**
 * DELETE /admin/expeditions/[id]
 * Delete an expedition
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const expeditionService = req.scope.resolve(EXPEDITION_MODULE)
  const { id } = req.params

  try {
    await expeditionService.deleteExpeditions(id)
    res.json({ id, deleted: true })
  } catch (error: any) {
    res.status(404).json({ type: 'not_found', message: `Expedition not found: ${id}` })
  }
}
