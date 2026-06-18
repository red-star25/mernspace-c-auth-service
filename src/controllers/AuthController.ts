import type { NextFunction, Response } from 'express'
import type {
    AuthRequest,
    LoginUserRequest,
    RegisterUserRequest,
} from '../types/index.js'
import type { UserService } from '../services/UserService.js'
import type { Logger } from 'winston'
import { validationResult } from 'express-validator'
import type { JwtPayload } from 'jsonwebtoken'
import { TokenService } from '../services/TokenService.js'
import createHttpError from 'http-errors'
import type { CredentialService } from '../services/CredentialService.js'
import { Roles } from '../constants/index.js'

export class AuthController {
    constructor(
        private userService: UserService,
        private logger: Logger,
        private tokenService: TokenService,
        private credentialService: CredentialService,
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
                role: Roles.CUSTOMER,
            })
            this.logger.info('User has been registered', { id: user.id })

            const payload: JwtPayload = {
                sub: String(user.id),
                role: user.role,
            }

            const accessToken = this.tokenService.generateAccessToken(payload)

            const newRefreshToken =
                await this.tokenService.persistRefreshToken(user)

            const refreshToken = this.tokenService.generateRefreshToken({
                ...payload,
                id: String(newRefreshToken.id),
            })

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

    async login(req: LoginUserRequest, res: Response, next: NextFunction) {
        const result = validationResult(req)
        if (!result.isEmpty()) {
            return res.status(400).json({
                errors: result.array(),
            })
        }
        const { email, password } = req.body

        this.logger.debug('New request to login a user', {
            email,
            password: '*****',
        })
        try {
            const user = await this.userService.findByEmailWithPassword(email)
            if (!user) {
                const err = createHttpError(
                    400,
                    'Email or password does not match',
                )
                next(err)
                return
            }

            const doesPasswordMatch =
                await this.credentialService.comparePassword(
                    password,
                    user.password,
                )
            if (!doesPasswordMatch) {
                const err = createHttpError(
                    400,
                    'Email or password does not match',
                )
                next(err)
                return
            }

            const payload: JwtPayload = {
                sub: String(user.id),
                role: user.role,
            }

            const accessToken = this.tokenService.generateAccessToken(payload)

            const newRefreshToken =
                await this.tokenService.persistRefreshToken(user)

            const refreshToken = this.tokenService.generateRefreshToken({
                ...payload,
                id: String(newRefreshToken.id),
            })

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
            this.logger.info('User has been logged in', { id: user.id })
            res.status(200).json({ id: user.id })
        } catch (error) {
            next(error)
            return
        }
    }

    async self(req: AuthRequest, res: Response) {
        console.log(req.auth)
        const user = await this.userService.findById(Number(req.auth.sub))
        res.json({ ...user, password: undefined })
    }

    async refresh(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const payload: JwtPayload = {
                sub: req.auth.sub,
                role: req.auth.role,
            }
            const accessToken = this.tokenService.generateAccessToken(payload)

            const user = await this.userService.findById(Number(req.auth.sub))
            if (!user) {
                const error = createHttpError(
                    400,
                    'user with the token could not find',
                )
                next(error)
                return
            }

            const newRefreshToken =
                await this.tokenService.persistRefreshToken(user)

            // Delete old refresh token
            await this.tokenService.deleteRefreshToken(Number(req.auth.id))

            const refreshToken = this.tokenService.generateRefreshToken({
                ...payload,
                id: String(newRefreshToken.id),
            })

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
            this.logger.info('User has been logged in', { id: user.id })
            res.json({ id: user.id })
        } catch (error) {
            next(error)
            return
        }
    }

    async logout(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const tokenId = req.auth.id
            await this.tokenService.deleteRefreshToken(Number(tokenId))
            this.logger.info('User has been logged out', { id: req.auth.sub })

            res.clearCookie('accessToken')
            res.clearCookie('refreshToken')

            res.json({})
        } catch (error) {
            next(error)
            return
        }
    }
}
