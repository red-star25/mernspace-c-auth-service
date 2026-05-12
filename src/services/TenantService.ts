import type { Repository } from 'typeorm'
import type { ITenant } from '../types/index.js'
import type { Tenant } from '../entity/Tenants.js'

export class TenantService {
    constructor(private tenantRepository: Repository<Tenant>) {}

    async create(tenantData: ITenant) {
        return await this.tenantRepository.save(tenantData)
    }
}
