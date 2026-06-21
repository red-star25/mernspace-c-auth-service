import { DataSource } from 'typeorm'
import request from 'supertest'
import { AppDataSource } from '../../src/config/data-source'
import app from '../../src/app'
import { User } from '../../src/entity/User'
import { Tenant } from '../../src/entity/Tenants'
import { Roles } from '../../src/constants'
import { createJWKSMock, createTenant } from '../utils'

describe('UserController — update / getAll / getOne / destroy', () => {
    let connection: DataSource
    let jwks: ReturnType<typeof createJWKSMock>
    let adminToken: string

    beforeAll(async () => {
        jwks = createJWKSMock('http://localhost:5501')
        connection = await AppDataSource.initialize()
    })

    beforeEach(async () => {
        jwks.start()
        await connection.dropDatabase()
        await connection.synchronize()
        adminToken = jwks.token({ sub: '1', role: Roles.ADMIN })
    })

    afterEach(() => {
        jwks.stop()
    })

    afterAll(async () => {
        await connection.destroy()
    })

    // ─── helper ────────────────────────────────────────────────────────────────
    async function seedUser(
        overrides: Partial<User> = {},
        tenant?: Tenant,
    ): Promise<User> {
        const repo = connection.getRepository(User)
        return repo.save({
            firstName: 'John',
            lastName: 'Doe',
            email: `john_${Date.now()}@example.com`,
            password: 'hashedpass',
            role: Roles.MANAGER,
            ...(tenant ? { tenant } : {}),
            ...overrides,
        })
    }

    // =========================================================================
    // PATCH /users/:id
    // =========================================================================
    describe('PATCH /users/:id', () => {
        it('should return 200 and the updated user id when admin updates a user', async () => {
            const tenant = await createTenant(connection.getRepository(Tenant))
            const user = await seedUser({}, tenant)

            const response = await request(app)
                .patch(`/users/${user.id}`)
                .set('Cookie', [`accessToken=${adminToken}`])
                .send({
                    firstName: 'Updated',
                    lastName: 'Name',
                    role: Roles.MANAGER,
                    email: user.email,
                    tenantId: tenant.id,
                })

            expect(response.statusCode).toBe(200)
            expect((response.body as Record<string, number>).id).toBe(user.id)
        })

        it('should actually persist the updated fields in the database', async () => {
            const tenant = await createTenant(connection.getRepository(Tenant))
            const user = await seedUser({}, tenant)

            await request(app)
                .patch(`/users/${user.id}`)
                .set('Cookie', [`accessToken=${adminToken}`])
                .send({
                    firstName: 'Changed',
                    lastName: 'Last',
                    role: Roles.MANAGER,
                    email: user.email,
                    tenantId: tenant.id,
                })

            const updated = await connection
                .getRepository(User)
                .findOneBy({ id: user.id })

            expect(updated?.firstName).toBe('Changed')
            expect(updated?.lastName).toBe('Last')
        })

        it('should return 403 when a non-admin tries to update a user', async () => {
            const tenant = await createTenant(connection.getRepository(Tenant))
            const user = await seedUser({}, tenant)
            const managerToken = jwks.token({ sub: '1', role: Roles.MANAGER })

            const response = await request(app)
                .patch(`/users/${user.id}`)
                .set('Cookie', [`accessToken=${managerToken}`])
                .send({
                    firstName: 'Hacker',
                    lastName: 'Person',
                    role: Roles.MANAGER,
                    email: user.email,
                    tenantId: tenant.id,
                })

            expect(response.statusCode).toBe(403)
        })

        it('should return 401 when no token is provided', async () => {
            const tenant = await createTenant(connection.getRepository(Tenant))
            const user = await seedUser({}, tenant)

            const response = await request(app)
                .patch(`/users/${user.id}`)
                .send({
                    firstName: 'No',
                    lastName: 'Auth',
                    role: Roles.MANAGER,
                    email: user.email,
                    tenantId: tenant.id,
                })

            expect(response.statusCode).toBe(401)
        })

        it('should return 400 when validation fails on update', async () => {
            const tenant = await createTenant(connection.getRepository(Tenant))
            const user = await seedUser({}, tenant)

            // sending an empty firstName which should fail validation
            const response = await request(app)
                .patch(`/users/${user.id}`)
                .set('Cookie', [`accessToken=${adminToken}`])
                .send({
                    firstName: '',
                    lastName: 'Name',
                    role: Roles.MANAGER,
                    email: user.email,
                    tenantId: tenant.id,
                })

            expect(response.statusCode).toBe(400)
        })
    })

    // =========================================================================
    // GET /users
    // =========================================================================
    describe('GET /users', () => {
        it('should return 200 with a paginated list of users', async () => {
            const tenant = await createTenant(connection.getRepository(Tenant))
            await seedUser({ email: 'a@example.com' }, tenant)
            await seedUser({ email: 'b@example.com' }, tenant)

            const response = await request(app)
                .get('/users')
                .set('Cookie', [`accessToken=${adminToken}`])
                .query({ currentPage: 1, perPage: 10 })

            expect(response.statusCode).toBe(200)
            expect(response.body).toHaveProperty('data')
            expect(
                (response.body as { data: unknown[] }).data.length,
            ).toBeGreaterThanOrEqual(2)
        })

        it('should return 403 when a non-admin tries to list users', async () => {
            const managerToken = jwks.token({ sub: '1', role: Roles.MANAGER })

            const response = await request(app)
                .get('/users')
                .set('Cookie', [`accessToken=${managerToken}`])
                .query({ currentPage: 1, perPage: 10 })

            expect(response.statusCode).toBe(403)
        })

        it('should return 401 when no token is provided', async () => {
            const response = await request(app)
                .get('/users')
                .query({ currentPage: 1, perPage: 10 })

            expect(response.statusCode).toBe(401)
        })

        it('should include pagination metadata in the response', async () => {
            const response = await request(app)
                .get('/users')
                .set('Cookie', [`accessToken=${adminToken}`])
                .query({ currentPage: 1, perPage: 5 })

            expect(response.body).toHaveProperty('currentPage')
            expect(response.body).toHaveProperty('perPage')
            expect(response.body).toHaveProperty('total')
        })
    })

    // =========================================================================
    // GET /users/:id
    // =========================================================================
    describe('GET /users/:id', () => {
        it('should return 200 and the user data for a valid id', async () => {
            const tenant = await createTenant(connection.getRepository(Tenant))
            const user = await seedUser({}, tenant)

            const response = await request(app)
                .get(`/users/${user.id}`)
                .set('Cookie', [`accessToken=${adminToken}`])

            expect(response.statusCode).toBe(200)
            expect((response.body as Record<string, number>).id).toBe(user.id)
        })

        it('should return 400 when the user does not exist', async () => {
            const response = await request(app)
                .get('/users/99999')
                .set('Cookie', [`accessToken=${adminToken}`])

            expect(response.statusCode).toBe(400)
        })

        it('should return 403 when a non-admin requests a user', async () => {
            const tenant = await createTenant(connection.getRepository(Tenant))
            const user = await seedUser({}, tenant)
            const managerToken = jwks.token({ sub: '1', role: Roles.MANAGER })

            const response = await request(app)
                .get(`/users/${user.id}`)
                .set('Cookie', [`accessToken=${managerToken}`])

            expect(response.statusCode).toBe(403)
        })

        it('should return 401 when no token is provided', async () => {
            const response = await request(app).get('/users/1')

            expect(response.statusCode).toBe(401)
        })
    })

    // =========================================================================
    // DELETE /users/:id
    // =========================================================================
    describe('DELETE /users/:id', () => {
        it('should return 200 and the deleted user id', async () => {
            const tenant = await createTenant(connection.getRepository(Tenant))
            const user = await seedUser({}, tenant)

            const response = await request(app)
                .delete(`/users/${user.id}`)
                .set('Cookie', [`accessToken=${adminToken}`])

            expect(response.statusCode).toBe(200)
            expect((response.body as Record<string, number>).id).toBe(user.id)
        })

        it('should actually remove the user from the database', async () => {
            const tenant = await createTenant(connection.getRepository(Tenant))
            const user = await seedUser({}, tenant)

            await request(app)
                .delete(`/users/${user.id}`)
                .set('Cookie', [`accessToken=${adminToken}`])

            const deleted = await connection
                .getRepository(User)
                .findOneBy({ id: user.id })

            expect(deleted).toBeNull()
        })

        it('should return 403 when a non-admin tries to delete a user', async () => {
            const tenant = await createTenant(connection.getRepository(Tenant))
            const user = await seedUser({}, tenant)
            const managerToken = jwks.token({ sub: '1', role: Roles.MANAGER })

            const response = await request(app)
                .delete(`/users/${user.id}`)
                .set('Cookie', [`accessToken=${managerToken}`])

            expect(response.statusCode).toBe(403)
        })

        it('should return 401 when no token is provided', async () => {
            const response = await request(app).delete('/users/1')

            expect(response.statusCode).toBe(401)
        })
    })
})
