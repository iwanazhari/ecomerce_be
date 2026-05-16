import { model } from '@medusajs/framework/utils'

const StoreNotification = model.define('store_notification', {
  id: model.id({ prefix: 'snotif' }).primaryKey(),
  customer_id: model.text().index(),
  type: model.text(),
  title: model.text(),
  message: model.text(),
  is_read: model.boolean().default(false),
  data: model.json().nullable(),
})

export default StoreNotification
