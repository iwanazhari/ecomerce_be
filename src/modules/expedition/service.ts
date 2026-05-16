import { MedusaService } from '@medusajs/framework/utils'
import Expedition from './models/expedition'

class ExpeditionModuleService extends MedusaService({ Expedition }) {}

export default ExpeditionModuleService
