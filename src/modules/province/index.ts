import { Module } from '@medusajs/framework/utils'
import ProvinceModuleService from './service'

export const PROVINCE_MODULE = 'province'

export default Module(PROVINCE_MODULE, {
  service: ProvinceModuleService,
})
