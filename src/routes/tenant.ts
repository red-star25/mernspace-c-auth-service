import express from 'express'
import { TenantController } from '../controllers/TenantController.js'
import { TenantService } from '../services/TenantService.js'
import { AppDataSource } from '../config/data-source.js'
import { Tenant } from '../entity/Tenants.js'
import logger from '../config/logger.js'
import authenticate from '../middlewares/authenticate.js'
import { canAccess } from '../middlewares/canAccess.js'
import { Roles } from '../constants/index.js'

const router = express.Router()

const tenantRepository = AppDataSource.getRepository(Tenant)
const tenantService = new TenantService(tenantRepository)
const tenantController = new TenantController(tenantService, logger)
router.post('/', authenticate, canAccess([Roles.ADMIN]), (req, res, next) =>
    tenantController.create(req, res, next),
)

export default router
