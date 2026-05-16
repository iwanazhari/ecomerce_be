import { Module } from '@medusajs/framework/utils'
import NotificationCustomModuleService from './service'

export const WATERPRO_NOTIFICATION_MODULE = 'waterproNotification'

export default Module(WATERPRO_NOTIFICATION_MODULE, {
  service: NotificationCustomModuleService,
})
