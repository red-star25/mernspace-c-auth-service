import jwt, { type JwtPayload } from 'jsonwebtoken'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import createHttpError from 'http-errors'
import { Config } from '../config/index.js'
import { RefreshToken } from '../entity/RefreshToken.js'
import type { User } from '../entity/User.js'
import type { Repository } from 'typeorm'

const DEFAULT_PRIVATE_KEY_PATH = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../certs/private.pem',
)

function readPrivateKey(): string {
    const { PRIVATE_KEY_PATH } = Config

    if (PRIVATE_KEY_PATH?.includes('BEGIN')) {
        return PRIVATE_KEY_PATH
    }

    const keyPath = PRIVATE_KEY_PATH || DEFAULT_PRIVATE_KEY_PATH

    try {
        return fs.readFileSync(keyPath, 'utf-8')
    } catch {
        throw createHttpError(500, 'Error while reading private key')
    }
}

export class TokenService {
    constructor(
        private readonly refreshTokenRepository: Repository<RefreshToken>,
    ) {}

    generateAccessToken(payload: JwtPayload) {
        const privateKey = readPrivateKey()

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
