import { MedusaService } from '@medusajs/framework/utils'
import StoreNotification from './models/notification'

class NotificationCustomModuleService extends MedusaService({ StoreNotification }) {}

export default NotificationCustomModuleService
