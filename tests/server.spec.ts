import { jest } from '@jest/globals'
import app from '../src/app'
import { AppDataSource } from '../src/config/data-source'
import { Config } from '../src/config'
import logger from '../src/config/logger'
import { Roles } from '../src/constants'
import { ensureAdminUser, startServer } from '../src/server'

describe('ensureAdminUser', () => {
    const originalConfig = {
        ADMIN_EMAIL: Config.ADMIN_EMAIL,
        ADMIN_PASSWORD: Config.ADMIN_PASSWORD,
        ADMIN_FIRST_NAME: Config.ADMIN_FIRST_NAME,
        ADMIN_LAST_NAME: Config.ADMIN_LAST_NAME,
    }

    beforeEach(() => {
        jest.spyOn(logger, 'warn').mockImplementation(() => logger)
        jest.spyOn(logger, 'info').mockImplementation(() => logger)
    })

    afterEach(() => {
        Config.ADMIN_EMAIL = originalConfig.ADMIN_EMAIL
        Config.ADMIN_PASSWORD = originalConfig.ADMIN_PASSWORD
        Config.ADMIN_FIRST_NAME = originalConfig.ADMIN_FIRST_NAME
        Config.ADMIN_LAST_NAME = originalConfig.ADMIN_LAST_NAME
        jest.restoreAllMocks()
    })

    it('skips bootstrap when admin credentials are not configured', async () => {
        Config.ADMIN_EMAIL = undefined
        Config.ADMIN_PASSWORD = undefined

        await ensureAdminUser()

        expect(logger.warn).toHaveBeenCalledWith(
            'Admin credentials not configured, skipping bootstrap',
        )
    })

    it('skips bootstrap when admin already exists', async () => {
        Config.ADMIN_EMAIL = 'admin@test.com'
        Config.ADMIN_PASSWORD = 'secret'
        const findOne = jest
            .fn()
            .mockResolvedValue({ id: 1, role: Roles.ADMIN })
        jest.spyOn(AppDataSource, 'getRepository').mockReturnValue({
            findOne,
            save: jest.fn(),
        } as never)

        await ensureAdminUser()

        expect(logger.info).toHaveBeenCalledWith(
            'Admin user already exists, skipping bootstrap',
        )
    })

    it('creates default admin and logs success', async () => {
        Config.ADMIN_EMAIL = 'admin@test.com'
        Config.ADMIN_PASSWORD = 'secret'
        Config.ADMIN_FIRST_NAME = undefined
        Config.ADMIN_LAST_NAME = undefined

        const findOne = jest
            .fn()
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null)
        const save = jest.fn().mockResolvedValue({
            id: 42,
            firstName: 'System',
            lastName: 'Admin',
            email: 'admin@test.com',
            role: Roles.ADMIN,
        })
        jest.spyOn(AppDataSource, 'getRepository').mockReturnValue({
            findOne,
            save,
        } as never)

        await ensureAdminUser()

        expect(save).toHaveBeenCalledWith(
            expect.objectContaining({
                firstName: 'System',
                lastName: 'Admin',
                email: 'admin@test.com',
                role: Roles.ADMIN,
            }),
        )
        expect(logger.info).toHaveBeenCalledWith('Default admin user ready', {
            id: 42,
        })
    })
})

describe('startServer', () => {
    beforeEach(() => {
        jest.spyOn(logger, 'info').mockImplementation(() => logger)
        jest.spyOn(AppDataSource, 'initialize').mockResolvedValue(AppDataSource)
        jest.spyOn(AppDataSource, 'getRepository').mockReturnValue({
            findOne: jest.fn().mockResolvedValue({ id: 1, role: Roles.ADMIN }),
        } as never)
        jest.spyOn(app, 'listen').mockImplementation((_port, callback) => {
            if (typeof callback === 'function') {
                callback()
            }
            return app
        })
        Config.ADMIN_EMAIL = undefined
        Config.ADMIN_PASSWORD = undefined
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    it('initializes database and starts listening', async () => {
        await startServer()

        expect(AppDataSource.initialize).toHaveBeenCalled()
        expect(logger.info).toHaveBeenCalledWith(
            'Database connected successfully',
        )
        expect(app.listen).toHaveBeenCalledWith(
            Config.PORT,
            expect.any(Function),
        )
        expect(logger.info).toHaveBeenCalledWith('Server listening on port', {
            port: Config.PORT,
        })
    })

    it('exits process when startup fails', async () => {
        jest.spyOn(AppDataSource, 'initialize').mockRejectedValue(
            new Error('connection failed'),
        )
        const exitSpy = jest
            .spyOn(process, 'exit')
            .mockImplementation((() => undefined) as never)

        await startServer()

        expect(exitSpy).toHaveBeenCalledWith(1)
        exitSpy.mockRestore()
    })
})
