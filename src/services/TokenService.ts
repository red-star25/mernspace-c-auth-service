import path from 'path'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import fs from 'fs'
import { fileURLToPath } from 'url'
import createHttpError from 'http-errors'
import { Config } from '../config/index.js'
import { RefreshToken } from '../entity/RefreshToken.js'
import type { User } from '../entity/User.js'
import type { Repository } from 'typeorm'

const PRIVATE_KEY_PATH = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../certs/private.pem',
)

export class TokenService {
    constructor(private refreshTokenRepository: Repository<RefreshToken>) {}

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

    async persistRefreshToken(user: User) {
        // Persist the refresh token
        const MS_IN_YEAR = 1000 * 60 * 60 * 24 * 365 // 1Y
        const refreshTokenRepo = this.refreshTokenRepository
        const newRefreshToken = await refreshTokenRepo.save({
            user: user,
            expiresAt: new Date(Date.now() + MS_IN_YEAR),
        })

        return newRefreshToken
    }

    async deleteRefreshToken(tokenId: number) {
        return await this.refreshTokenRepository.delete({ id: tokenId })
    }
}
