import { config } from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

config({
    path: path.join(__dirname, `../../.env.${process.env.NODE_ENV || 'dev'}`),
})

const {
    PORT,
    NODE_ENV,
    DB_HOST,
    DB_PORT,
    DB_USERNAME,
    DB_PASSWORD,
    DB_NAME,
    REFRESH_TOKEN_SECRET,
    JWKS_URI,
    PRIVATE_KEY_PATH,
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
    ADMIN_FIRST_NAME,
    ADMIN_LAST_NAME,
} = process.env

export const Config = {
    PORT,
    NODE_ENV,
    DB_HOST,
    DB_PORT,
    DB_USERNAME,
    DB_PASSWORD,
    DB_NAME,
    REFRESH_TOKEN_SECRET,
    JWKS_URI,
    PRIVATE_KEY_PATH,
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
    ADMIN_FIRST_NAME,
    ADMIN_LAST_NAME,
}
