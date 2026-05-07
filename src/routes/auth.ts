import express, { type NextFunction, type Response } from 'express'
import { AuthController } from '../controllers/AuthController.js'
import { UserService } from '../services/UserService.js'
import { AppDataSource } from '../config/data-source.js'
import { User } from '../entity/User.js'
import logger from '../config/logger.js'
import type { RegisterUserRequest } from '../types/index.js'
import registerValidator from '../validators/register-validator.js'
import { TokenService } from '../services/TokenService.js'

const router = express.Router()
const userRepository = AppDataSource.getRepository(User)
const userService = new UserService(userRepository)
const tokenService = new TokenService()
const authController = new AuthController(userService, logger, tokenService)

router.post(
    '/register',
    registerValidator,
    (req: RegisterUserRequest, res: Response, next: NextFunction) =>
        authController.register(req, res, next),
)

export default router
