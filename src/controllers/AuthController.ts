import fs from 'fs'
import type { NextFunction, Response } from 'express'
import type { RegisterUserRequest } from '../types/index.js'
import type { UserService } from '../services/UserService.js'
import type { Logger } from 'winston'
import { validationResult } from 'express-validator'
import jwt from 'jsonwebtoken'
import type { JwtPayload } from 'jsonwebtoken'
import path from 'path'
import { fileURLToPath } from 'node:url'
import createHttpError from 'http-errors'
import { Config } from '../config/index.js'

const PRIVATE_KEY_PATH = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../certs/private.pem',
)

export class AuthController {
    constructor(
        private userService: UserService,
        private logger: Logger,
    ) {}

    async register(
        req: RegisterUserRequest,
        res: Response,
        next: NextFunction,
    ) {
        const result = validationResult(req)
        if (!result.isEmpty()) {
            return res.status(400).json({
                errors: result.array(),
            })
        }
        const { firstName, lastName, email, password } = req.body

        this.logger.debug('New request to register a user', {
            firstName,
            lastName,
            email,
            password: '*****',
        })
        try {
            const user = await this.userService.create({
                firstName,
                lastName,
                email,
                password,
            })
            this.logger.info('User has been registered', { id: user.id })

            let privateKey: Buffer
            try {
                privateKey = fs.readFileSync(PRIVATE_KEY_PATH)
            } catch {
                const err = createHttpError(
                    500,
                    'Error while reading private key',
                )
                next(err)
                return
            }

            const payload: JwtPayload = {
                sub: String(user.id),
                role: user.role,
            }
            const accessToken = jwt.sign(payload, privateKey, {
                algorithm: 'RS256',
                expiresIn: '1h',
                issuer: 'auth-service',
            })
            const refreshToken = jwt.sign(
                payload,
                Config.REFRESH_TOKEN_SECRET!,
                {
                    algorithm: 'HS256',
                    expiresIn: '1y',
                    issuer: 'auth-service',
                },
            )

            res.cookie('accessToken', accessToken, {
                domain: 'localhost',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60, // 1hr
                httpOnly: true, // very important
            })

            res.cookie('refreshToken', refreshToken, {
                domain: 'localhost',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
                httpOnly: true, // very important
            })

            res.status(201).json({ id: user.id })
        } catch (error) {
            next(error)
            return
        }
    }
}
