import 'reflect-metadata'
import app from './app.js'
import { AppDataSource } from './config/data-source.js'
import { Config } from './config/index.js'
import logger from './config/logger.js'

const startServer = async () => {
    const PORT = Config.PORT
    try {
        await AppDataSource.initialize()
        logger.info('Database connected successfully')
        app.listen(PORT, () => {
            logger.info('Server listening on port', { port: PORT })
        })
    } catch (err) {
        console.log(err)
        process.exit(1)
    }
}

await startServer()
