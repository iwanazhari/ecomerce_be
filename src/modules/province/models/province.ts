import { model } from '@medusajs/framework/utils'

const Province = model.define('province', {
  id: model.id({ prefix: 'prv' }).primaryKey(),
  name: model.text().unique(),
  code: model.text().nullable(),
})

export default Province
