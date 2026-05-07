import express, { type NextFunction, type Response } from 'express'
import { AuthController } from '../controllers/AuthController.js'
import { UserService } from '../services/UserService.js'
import { AppDataSource } from '../config/data-source.js'
import { User } from '../entity/User.js'
import logger from '../config/logger.js'
import type { LoginUserRequest, RegisterUserRequest } from '../types/index.js'
import registerValidator from '../validators/register-validator.js'
import { TokenService } from '../services/TokenService.js'
import { RefreshToken } from '../entity/RefreshToken.js'
import loginValidator from '../validators/login-validator.js'
import { CredentialService } from '../services/CredentialService.js'

const router = express.Router()
const userRepository = AppDataSource.getRepository(User)
const userService = new UserService(userRepository)
const refreshTokenRepo = AppDataSource.getRepository(RefreshToken)
const tokenService = new TokenService(refreshTokenRepo)
const credentialService = new CredentialService()
const authController = new AuthController(
    userService,
    logger,
    tokenService,
    credentialService,
)

router.post(
    '/register',
    registerValidator,
    (req: RegisterUserRequest, res: Response, next: NextFunction) =>
        authController.register(req, res, next),
)

router.post(
    '/login',
    loginValidator,
    (req: LoginUserRequest, res: Response, next: NextFunction) =>
        authController.login(req, res, next),
)

export default router
