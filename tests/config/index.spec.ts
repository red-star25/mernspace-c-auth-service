import { jest } from '@jest/globals'
import { Config } from '../../src/config'

describe('Config', () => {
    const envBackup = { ...process.env }

    afterEach(() => {
        process.env = { ...envBackup }
        jest.resetModules()
    })

    it('loads admin bootstrap settings from environment', () => {
        expect(Config).toHaveProperty('ADMIN_EMAIL')
        expect(Config).toHaveProperty('ADMIN_PASSWORD')
        expect(Config).toHaveProperty('ADMIN_FIRST_NAME')
        expect(Config).toHaveProperty('ADMIN_LAST_NAME')
    })

    it('loads database and auth settings from environment', () => {
        expect(Config.PORT).toBeDefined()
        expect(Config.DB_HOST).toBeDefined()
        expect(Config.DB_PORT).toBeDefined()
        expect(Config.DB_USERNAME).toBeDefined()
        expect(Config.DB_PASSWORD).toBeDefined()
        expect(Config.DB_NAME).toBeDefined()
        expect(Config.REFRESH_TOKEN_SECRET).toBeDefined()
        expect(Config.JWKS_URI).toBeDefined()
    })

    it('defaults NODE_ENV to dev when loading env file', async () => {
        process.env = {
            NODE_ENV: 'config-default-env-test',
        }

        const { Config: ReloadedConfig } = await import('../../src/config')

        expect(ReloadedConfig.NODE_ENV).toBe('config-default-env-test')
    })
})
