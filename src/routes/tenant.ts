import express from 'express'
import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { TenantController } from '../controllers/TenantController.js'
import { TenantService } from '../services/TenantService.js'
import { AppDataSource } from '../config/data-source.js'
import { Tenant } from '../entity/Tenants.js'
import logger from '../config/logger.js'
import authenticate from '../middlewares/authenticate.js'
import { canAccess } from '../middlewares/canAccess.js'
import { Roles } from '../constants/index.js'
import type { CreateTenantRequest } from '../types/index.js'
import tenantValidator from '../validators/tenant-validator.js'
import listUsersValidator from '../validators/list-users-validator.js'

const router = express.Router()

const tenantRepository = AppDataSource.getRepository(Tenant)
const tenantService = new TenantService(tenantRepository)
const tenantController = new TenantController(tenantService, logger)

router.post(
    '/',
    authenticate as RequestHandler,
    canAccess([Roles.ADMIN]),
    tenantValidator,
    (req: CreateTenantRequest, res: Response, next: NextFunction) =>
        tenantController.create(req, res, next) as unknown as RequestHandler,
)

router.patch(
    '/:id',
    authenticate as RequestHandler,
    canAccess([Roles.ADMIN]),
    tenantValidator,
    (req: CreateTenantRequest, res: Response, next: NextFunction) =>
        tenantController.update(req, res, next) as unknown as RequestHandler,
)
router.get(
    '/',
    listUsersValidator,
    (req: Request, res: Response, next: NextFunction) =>
        tenantController.getAll(req, res, next) as unknown as RequestHandler,
)
router.get(
    '/:id',
    authenticate as RequestHandler,
    canAccess([Roles.ADMIN]),
    (req, res, next) =>
        tenantController.getOne(req, res, next) as unknown as RequestHandler,
)
router.delete(
    '/:id',
    authenticate as RequestHandler,
    canAccess([Roles.ADMIN]),
    (req, res, next) =>
        tenantController.destroy(req, res, next) as unknown as RequestHandler,
)

export default router
