import 'reflect-metadata'
import app from './app.js'
import { AppDataSource } from './config/data-source.js'
import { Config } from './config/index.js'
import logger from './config/logger.js'
import { User } from './entity/User.js'
import { UserService } from './services/UserService.js'
import { Roles } from './constants/index.js'

const ensureAdminUser = async () => {
    const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FIRST_NAME, ADMIN_LAST_NAME } =
        Config

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
        logger.warn('Admin credentials not configured, skipping bootstrap')
        return
    }

    const userRepository = AppDataSource.getRepository(User)
    const userService = new UserService(userRepository)

    const existingAdmin = await userRepository.findOne({
        where: { role: Roles.ADMIN },
    })

    if (existingAdmin) {
        logger.info('Admin user already exists, skipping bootstrap')
        return
    }

    const admin = await userService.ensureDefaultAdmin({
        firstName: ADMIN_FIRST_NAME ?? 'System',
        lastName: ADMIN_LAST_NAME ?? 'Admin',
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: Roles.ADMIN,
    })

    if (admin) {
        logger.info('Default admin user ready', { id: admin.id })
    }
}

const startServer = async () => {
    const PORT = Config.PORT
    try {
        await AppDataSource.initialize()
        logger.info('Database connected successfully')
        await ensureAdminUser()
        app.listen(PORT, () => {
            logger.info('Server listening on port', { port: PORT })
        })
    } catch {
        process.exit(1)
    }
}

await startServer()
