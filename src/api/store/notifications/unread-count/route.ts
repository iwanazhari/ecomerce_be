import type { MedusaRequest, MedusaResponse } from '@medusajs/framework'
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const notificationService: any = req.scope.resolve('waterproNotification')
  const authContext = (req as any).authContext as { customer_id?: string } | undefined
  if (!authContext?.customer_id) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  const [, count] = await notificationService.listAndCountStoreNotifications({
    customer_id: authContext.customer_id,
    is_read: false,
  })
  res.json({ count })
}
