import { jest } from '@jest/globals'

describe('data-source configuration', () => {
    const envBackup = { ...process.env }

    afterEach(() => {
        process.env = { ...envBackup }
        jest.resetModules()
        jest.restoreAllMocks()
    })

    it('throws when required database values are missing', async () => {
        process.env = {
            NODE_ENV: 'missing-db-test',
            DB_PORT: '5432',
            DB_USERNAME: 'root',
            DB_NAME: 'test_db',
        }

        const consoleSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => undefined)

        await expect(import('../../src/config/data-source')).rejects.toThrow(
            'Missing database values',
        )
        expect(consoleSpy).toHaveBeenCalled()
    })

    it('throws when DB_PORT is not a valid number', async () => {
        process.env = {
            NODE_ENV: 'invalid-port-test',
            DB_HOST: 'localhost',
            DB_PORT: 'not-a-number',
            DB_USERNAME: 'root',
            DB_PASSWORD: 'root',
            DB_NAME: 'test_db',
        }

        const consoleSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => undefined)

        await expect(import('../../src/config/data-source')).rejects.toThrow(
            'DB_PORT must be a valid number',
        )
        expect(consoleSpy).toHaveBeenCalled()
    })

    it('creates data source when database env is valid', async () => {
        process.env = {
            NODE_ENV: 'valid-db-test',
            DB_HOST: 'localhost',
            DB_PORT: '5432',
            DB_USERNAME: 'root',
            DB_PASSWORD: 'root',
            DB_NAME: 'test_db',
        }

        const { AppDataSource } = await import('../../src/config/data-source')

        expect(AppDataSource.options).toMatchObject({
            type: 'postgres',
            host: 'localhost',
            port: 5432,
            username: 'root',
            password: 'root',
            database: 'test_db',
        })
    })
})
