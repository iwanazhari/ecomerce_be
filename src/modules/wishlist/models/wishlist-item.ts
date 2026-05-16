import { model } from '@medusajs/framework/utils'

const WishlistItem = model.define('wishlist_item', {
  id: model.id({ prefix: 'wish' }).primaryKey(),
  customer_id: model.text().index(),
  product_id: model.text().index(),
  variant_id: model.text().nullable(),
})

export default WishlistItem
