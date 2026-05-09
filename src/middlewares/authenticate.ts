import type { Request } from 'express'
import { expressjwt, type GetVerificationKey } from 'express-jwt'
import jwkClient from 'jwks-rsa'
import { Config } from '../config/index.js'
import type { AuthCookie } from '../types/index.js'

export default expressjwt({
    secret: jwkClient.expressJwtSecret({
        jwksUri: Config.JWKS_URI!,
        cache: true,
        rateLimit: true,
    }) as GetVerificationKey,
    algorithms: ['RS256'],
    getToken(req: Request) {
        const authHeader = req.headers.authorization

        if (authHeader && authHeader.split(' ')[1] !== 'undefined') {
            const token = authHeader.split(' ')[1]
            if (token) {
                return token
            }
        }

        const { accessToken } = req.cookies as AuthCookie

        return accessToken
    },
})
