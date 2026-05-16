import { Module } from '@medusajs/framework/utils'
import ExpeditionModuleService from './service'

export const EXPEDITION_MODULE = 'expedition'

export default Module(EXPEDITION_MODULE, {
  service: ExpeditionModuleService,
})
