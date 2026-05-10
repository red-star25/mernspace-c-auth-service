import express, {
    type NextFunction,
    type Request,
    type Response,
} from 'express'
import { AuthController } from '../controllers/AuthController.js'
import { UserService } from '../services/UserService.js'
import { AppDataSource } from '../config/data-source.js'
import { User } from '../entity/User.js'
import logger from '../config/logger.js'
import type {
    AuthRequest,
    LoginUserRequest,
    RegisterUserRequest,
} from '../types/index.js'
import registerValidator from '../validators/register-validator.js'
import { TokenService } from '../services/TokenService.js'
import { RefreshToken } from '../entity/RefreshToken.js'
import loginValidator from '../validators/login-validator.js'
import { CredentialService } from '../services/CredentialService.js'
import authenticate from '../middlewares/authenticate.js'
import validateRefreshToken from '../middlewares/validateRefreshToken.js'
import parseRefreshToken from '../middlewares/parseRefreshToken.js'

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

router.get(
    '/self',
    authenticate,
    (req: Request, res: Response) =>
        void authController.self(req as AuthRequest, res),
)

router.post(
    '/refresh',
    validateRefreshToken,
    (req: Request, res: Response, next: NextFunction) =>
        void authController.refresh(req as AuthRequest, res, next),
)

router.post(
    '/logout',
    authenticate,
    parseRefreshToken,
    (req: Request, res: Response, next: NextFunction) =>
        void authController.logout(req as AuthRequest, res, next),
)

export default router
