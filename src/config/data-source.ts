import 'reflect-metadata'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DataSource, type DataSourceOptions } from 'typeorm'
import { Config } from './index.js'
import { User } from '../entity/User.js'
import { Tenant } from '../entity/Tenants.js'
import { RefreshToken } from '../entity/RefreshToken.js'
import createHttpError from 'http-errors'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function postgresDataSourceOptions(): DataSourceOptions {
    const { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME } = Config
    if (
        !DB_HOST ||
        !DB_PORT ||
        !DB_USERNAME ||
        DB_PASSWORD === undefined ||
        !DB_NAME
    ) {
        throw createHttpError(500, 'Missing database values')
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
        entities: [User, Tenant, RefreshToken],
        migrations: [path.join(__dirname, '../migration/*.{js,ts}')],
        subscribers: [],
    }
}

export const AppDataSource = new DataSource(postgresDataSourceOptions())
