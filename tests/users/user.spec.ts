import request from 'supertest'
import {
    describe,
    it,
    beforeAll,
    afterAll,
    beforeEach,
    afterEach,
    expect,
} from '@jest/globals'
import type { DataSource } from 'typeorm'
import { AppDataSource } from '../../src/config/data-source.js'
import app from '../../src/app.js'
import type { JWKSMock } from 'mock-jwks'
import { User } from '../../src/entity/User.js'
import { Roles } from '../../src/constants/index.js'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const mockJwksModule = require('mock-jwks') as {
    default: (jwksOrigin: string, jwksPath?: string) => JWKSMock
}
const createJWKSMock = mockJwksModule.default

describe('GET /auth/self', () => {
    let connection: DataSource
    let jwks: JWKSMock

    beforeAll(async () => {
        jwks = createJWKSMock('http://localhost:5501')
        connection = await AppDataSource.initialize()
    })

    beforeEach(async () => {
        jwks.start()
        // Database truncate
        await connection.dropDatabase()
        await connection.synchronize()
    })

    afterEach(() => {
        jwks.stop()
    })

    afterAll(async () => {
        await connection.destroy()
    })

    describe('Given all fields', () => {
        it('should return 200 status code', async () => {
            const accessToken = jwks.token({
                sub: '1',
                role: Roles.CUSTOMER,
            })

            const response = await request(app)
                .get('/auth/self')
                .set('Cookie', [`accessToken=${accessToken}`])
                .send()
            expect(response.statusCode).toBe(200)
        })

        it('should return user data', async () => {
            //Register user
            const userData = {
                firstName: 'Dhruv',
                lastName: 'Nakum',
                email: 'dhruv@gmail.com',
                password: 'pass',
            }
            const userRepository = connection.getRepository(User)
            const data = await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            })
            // Generate token
            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            })
            // Add token to cookie
            const response = await request(app)
                .get('/auth/self')
                .set('Cookie', [`accessToken=${accessToken}`])
                .send()

            // Assert
            const body = response.body as { id: number }
            expect(body.id).toBe(data.id)
        })
    })
})
