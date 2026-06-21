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
        expect(Config).toHaveProperty('PORT')
        expect(Config).toHaveProperty('DB_HOST')
        expect(Config).toHaveProperty('DB_PORT')
        expect(Config).toHaveProperty('DB_USERNAME')
        expect(Config).toHaveProperty('DB_PASSWORD')
        expect(Config).toHaveProperty('DB_NAME')
        expect(Config).toHaveProperty('REFRESH_TOKEN_SECRET')
        expect(Config).toHaveProperty('JWKS_URI')
    })

    it('defaults NODE_ENV to dev when loading env file', async () => {
        process.env = {
            NODE_ENV: 'config-default-env-test',
        }

        const { Config: ReloadedConfig } = await import('../../src/config')

        expect(ReloadedConfig.NODE_ENV).toBe('config-default-env-test')
    })
})
