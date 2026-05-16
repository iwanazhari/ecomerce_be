import type { MedusaRequest, MedusaResponse } from '@medusajs/framework'
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const notificationService: any = req.scope.resolve('waterproNotification')
  const authContext = (req as any).authContext as { customer_id?: string } | undefined
  if (!authContext?.customer_id) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  const limit = parseInt(req.query.limit as string) || 20
  const offset = parseInt(req.query.offset as string) || 0
  const unreadOnly = req.query.unreadOnly === 'true'
  const filters: Record<string, unknown> = { customer_id: authContext.customer_id }
  if (unreadOnly) {
    filters.is_read = false
  }
  const [items, count] = await notificationService.listAndCountStoreNotifications(filters, {
    skip: offset,
    take: limit,
    order: { created_at: 'DESC' },
  })
  res.json({ notifications: items, count, limit, offset })
}
