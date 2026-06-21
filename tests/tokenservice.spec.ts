import { DataSource, Repository } from 'typeorm'
import { RefreshToken } from '../src/entity/RefreshToken'
import { TokenService } from '../src/services/TokenService'
import { AppDataSource } from '../src/config/data-source'
import { User } from '../src/entity/User'
import { Roles } from '../src/constants'
import { Config } from '../src/config'

describe('TokenService', () => {
    let connection: DataSource
    let refreshTokenRepository: Repository<RefreshToken>
    let tokenService: TokenService

    beforeAll(async () => {
        connection = await AppDataSource.initialize()
    })

    beforeEach(async () => {
        await connection.dropDatabase()
        await connection.synchronize()
        refreshTokenRepository = connection.getRepository(RefreshToken)
        tokenService = new TokenService(refreshTokenRepository)
    })

    afterAll(async () => {
        await connection.destroy()
    })

    // ─── helper ────────────────────────────────────────────────────────────────
    async function seedUserAndToken(): Promise<{
        user: User
        refreshToken: RefreshToken
    }> {
        const userRepo = connection.getRepository(User)
        const user = await userRepo.save({
            firstName: 'Test',
            lastName: 'User',
            email: `test_${Date.now()}@example.com`,
            password: 'hashedpass',
            role: Roles.CUSTOMER,
        })

        const refreshToken = await refreshTokenRepository.save({
            user,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        })

        return { user, refreshToken }
    }

    // =========================================================================
    // deleteRefreshToken
    // =========================================================================
    describe('deleteRefreshToken', () => {
        it('should delete the refresh token by id', async () => {
            const { refreshToken } = await seedUserAndToken()

            await tokenService.deleteRefreshToken(refreshToken.id)

            const found = await refreshTokenRepository.findOneBy({
                id: refreshToken.id,
            })
            expect(found).toBeNull()
        })

        it('should not throw when deleting a token id that does not exist', async () => {
            await expect(
                tokenService.deleteRefreshToken(99999),
            ).resolves.not.toThrow()
        })

        it('should only delete the targeted token and leave others intact', async () => {
            const { refreshToken: first } = await seedUserAndToken()
            const { refreshToken: second } = await seedUserAndToken()

            await tokenService.deleteRefreshToken(first.id)

            const remaining = await refreshTokenRepository.find()
            expect(remaining).toHaveLength(1)
            expect(remaining[0].id).toBe(second.id)
        })
    })

    // =========================================================================
    // generateAccessToken — private key error path
    // =========================================================================
    describe('generateAccessToken — readPrivateKey error path', () => {
        const originalKeyPath = Config.PRIVATE_KEY_PATH

        afterEach(() => {
            // Restore env after each test so other tests are not affected
            Config.PRIVATE_KEY_PATH = originalKeyPath
        })

        it('should throw a 500 http error when the private key file cannot be read', () => {
            // Point to a path that definitely does not exist
            Config.PRIVATE_KEY_PATH = '/non/existent/path/private.pem'

            expect(() => {
                tokenService.generateAccessToken({ sub: '1', role: 'customer' })
            }).toThrow()
        })
    })

    // =========================================================================
    // persistRefreshToken
    // =========================================================================
    describe('persistRefreshToken', () => {
        it('should save a refresh token associated with the user', async () => {
            const userRepo = connection.getRepository(User)
            const user = await userRepo.save({
                firstName: 'Jane',
                lastName: 'Doe',
                email: `jane_${Date.now()}@example.com`,
                password: 'hashedpass',
                role: Roles.CUSTOMER,
            })

            const savedToken = await tokenService.persistRefreshToken(user)

            expect(savedToken).toHaveProperty('id')
            const found = await refreshTokenRepository.findOneBy({
                id: savedToken.id,
            })
            expect(found).not.toBeNull()
        })
    })
})
