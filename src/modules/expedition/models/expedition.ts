import { model } from '@medusajs/framework/utils'

const Expedition = model.define('expedition', {
  id: model.id({ prefix: 'exp' }).primaryKey(),
  name: model.text(),
  code: model.text().unique().index(),
  tracking_url_template: model.text().nullable(),
  is_active: model.boolean().default(true),
  description: model.text().nullable(),
  /**
   * Flat shipping rate in IDR (rupiah) stored as bigNumber.
   * Used for both external couriers (JNE, J&T) and store delivery.
   */
  flat_rate: model.bigNumber().default(0),
  /**
   * Whether this is store's own delivery service.
   * When true: tracking_url_template is ignored, flat_rate can be 0 for free delivery.
   */
  is_store_delivery: model.boolean().default(false),
})

export default Expedition
