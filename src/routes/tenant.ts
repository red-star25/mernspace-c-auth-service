import express, { type NextFunction } from 'express'
import { TenantController } from '../controllers/TenantController.js'
import { TenantService } from '../services/TenantService.js'
import { AppDataSource } from '../config/data-source.js'
import { Tenant } from '../entity/Tenants.js'
import logger from '../config/logger.js'

const router = express.Router()

const tenantRepository = AppDataSource.getRepository(Tenant)
const tenantService = new TenantService(tenantRepository)
const tenantController = new TenantController(tenantService, logger)
router.post('/', (req, res, next: NextFunction) =>
    tenantController.create(req, res, next),
)

export default router
