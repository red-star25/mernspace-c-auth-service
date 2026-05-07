import path from 'path'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import fs from 'fs'
import { fileURLToPath } from 'url'
import createHttpError from 'http-errors'
import { Config } from '../config/index.js'

const PRIVATE_KEY_PATH = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../certs/private.pem',
)

export class TokenService {
    generateAccessToken(payload: JwtPayload) {
        let privateKey: Buffer
        try {
            privateKey = fs.readFileSync(PRIVATE_KEY_PATH)
        } catch {
            const err = createHttpError(500, 'Error while reading private key')
            throw err
        }

        const accessToken = jwt.sign(payload, privateKey, {
            algorithm: 'RS256',
            expiresIn: '1h',
            issuer: 'auth-service',
        })

        return accessToken
    }

    generateRefreshToken(payload: JwtPayload) {
        const refreshToken = jwt.sign(payload, Config.REFRESH_TOKEN_SECRET!, {
            algorithm: 'HS256',
            expiresIn: '1y',
            issuer: 'auth-service',
            jwtid: String(payload.id),
        })

        return refreshToken
    }
}
