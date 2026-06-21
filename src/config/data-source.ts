import 'reflect-metadata'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

config({
    path: path.join(__dirname, `../../.env.${process.env.NODE_ENV || 'dev'}`),
})
import { fileURLToPath } from 'node:url'
import { DataSource, type DataSourceOptions } from 'typeorm'
import { User } from '../entity/User.js'
import { Tenant } from '../entity/Tenants.js'
import { RefreshToken } from '../entity/RefreshToken.js'
import createHttpError from 'http-errors'
import { config } from 'dotenv'

function postgresDataSourceOptions(): DataSourceOptions {
    const DB_HOST = process.env.DB_HOST
    const DB_PORT = process.env.DB_PORT
    const DB_USERNAME = process.env.DB_USERNAME
    const DB_PASSWORD = process.env.DB_PASSWORD
    const DB_NAME = process.env.DB_NAME
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

export const AppDataSource = (() => {
    try {
        return new DataSource(postgresDataSourceOptions())
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error('DataSource init error:', e)
        throw e
    }
})()
