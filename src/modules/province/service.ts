import { MedusaService } from '@medusajs/framework/utils'
import Province from './models/province'

class ProvinceModuleService extends MedusaService({ Province }) {}

export default ProvinceModuleService
