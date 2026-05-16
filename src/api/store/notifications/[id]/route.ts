import type { MedusaRequest, MedusaResponse } from '@medusajs/framework'
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const notificationService: any = req.scope.resolve('waterproNotification')
  const id = req.params.id
  await notificationService.updateStoreNotifications({ id, is_read: true })
  res.json({ success: true })
}
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const notificationService: any = req.scope.resolve('waterproNotification')
  const id = req.params.id
  await notificationService.deleteStoreNotifications(id)
  res.json({ deleted: true })
}
