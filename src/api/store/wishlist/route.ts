import type { MedusaRequest, MedusaResponse } from '@medusajs/framework'
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const wishlistService: any = req.scope.resolve('wishlist')
  const authContext = (req as any).authContext as { customer_id?: string } | undefined
  if (!authContext?.customer_id) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  const [items, count] = await wishlistService.listAndCountWishlistItems({
    customer_id: authContext.customer_id,
  })
  res.json({ wishlist: { items, count } })
}
