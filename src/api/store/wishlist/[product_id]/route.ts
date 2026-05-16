import type { MedusaRequest, MedusaResponse } from '@medusajs/framework'
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const wishlistService: any = req.scope.resolve('wishlist')
  const authContext = (req as any).authContext as { customer_id?: string } | undefined
  if (!authContext?.customer_id) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  const productId = req.params.product_id
  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required' })
  }
  const [existing] = await wishlistService.listWishlistItems({
    customer_id: authContext.customer_id,
    product_id: productId,
  })
  if (existing) {
    return res.status(409).json({ error: 'Already in wishlist' })
  }
  const item = await wishlistService.createWishlistItems({
    customer_id: authContext.customer_id,
    product_id: productId,
  })
  res.status(201).json({ wishlist_item: item })
}
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const wishlistService: any = req.scope.resolve('wishlist')
  const authContext = (req as any).authContext as { customer_id?: string } | undefined
  if (!authContext?.customer_id) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  const productId = req.params.product_id
  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required' })
  }
  const [item] = await wishlistService.listWishlistItems({
    customer_id: authContext.customer_id,
    product_id: productId,
  })
  if (item) {
    await wishlistService.deleteWishlistItems(item.id)
  }
  res.status(200).json({ deleted: true })
}
