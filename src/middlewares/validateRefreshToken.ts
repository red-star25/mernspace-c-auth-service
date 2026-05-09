import type { Request } from 'express'
import { expressjwt } from 'express-jwt'
import { Config } from '../config/index.js'
import type { AuthCookie, IRefreshTokenPayload } from '../types/index.js'
import { AppDataSource } from '../config/data-source.js'
import { RefreshToken } from '../entity/RefreshToken.js'
import logger from '../config/logger.js'

export default expressjwt({
    secret: Config.REFRESH_TOKEN_SECRET!,
    algorithms: ['HS256'],
    getToken(req: Request) {
        const { refreshToken } = req.cookies as AuthCookie
        return refreshToken
    },

    async isRevoked(req: Request, token) {
        try {
            const refreshTokenRepo = AppDataSource.getRepository(RefreshToken)
            const refreshToken = await refreshTokenRepo.findOne({
                where: {
                    id: Number((token?.payload as IRefreshTokenPayload).id),
                    user: { id: Number(token?.payload.sub) },
                },
            })

            return refreshToken === null
        } catch {
            logger.error('error while getting the refresh token', {
                id: (token?.payload as IRefreshTokenPayload).id,
            })
        }
        return true
    },
})
