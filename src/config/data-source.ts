import 'reflect-metadata'
import { DataSource, type DataSourceOptions } from 'typeorm'
import { User } from '../entity/User.js'
import { Config } from './index.js'
import { RefreshToken } from '../entity/RefreshToken.js'

function postgresDataSourceOptions(): DataSourceOptions {
    const { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME } = Config
    if (
        !DB_HOST ||
        !DB_PORT ||
        !DB_USERNAME ||
        DB_PASSWORD === undefined ||
        !DB_NAME
    ) {
        throw new Error(
            'Database configuration is incomplete. Set DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, and DB_NAME.',
        )
    }
    const port = Number(DB_PORT)
    if (!Number.isFinite(port)) {
        throw new Error('DB_PORT must be a valid number')
    }
    return {
        type: 'postgres',
        host: DB_HOST,
        port,
        username: DB_USERNAME,
        password: DB_PASSWORD,
        database: DB_NAME,
        synchronize: false, // Always keep false
        logging: false,
        entities: [User, RefreshToken],
        migrations: ['src/migration/*.ts'],
        subscribers: [],
    }
}

export const AppDataSource = new DataSource(postgresDataSourceOptions())
