import type { NextFunction, Response } from 'express'
import type { TenantService } from '../services/TenantService.js'
import type { TenantRequest } from '../types/index.js'
import type { Logger } from 'winston'

export class TenantController {
    constructor(
        private tenantService: TenantService,
        private logger: Logger,
    ) {}

    async create(req: TenantRequest, res: Response, next: NextFunction) {
        const { name, address } = req.body

        this.logger.debug('New request to create a tenant', { name, address })

        try {
            const tenant = await this.tenantService.create({ name, address })
            this.logger.info('Tenant has been created', { id: tenant.id })
            res.status(201).json({ id: tenant.id })
        } catch (error) {
            this.logger.error('Failed to create a tenant', { error })
            next(error)
        }
    }
}
