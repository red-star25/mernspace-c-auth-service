import express from 'express'
import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { AppDataSource } from '../config/data-source.js'
import { UserService } from '../services/UserService.js'
import { UserController } from '../controllers/UserController.js'
import logger from '../config/logger.js'
import { User } from '../entity/User.js'
import createUserValidator from '../validators/create-user-validator.js'
import { canAccess } from '../middlewares/canAccess.js'
import authenticate from '../middlewares/authenticate.js'
import type { CreateUserRequest, UpdateUserRequest } from '../types/index.js'
import updateUserValidator from '../validators/update-user-validator.js'
import listUsersValidator from '../validators/list-users-validator.js'
import { Roles } from '../constants/index.js'

const router = express.Router()

const userRepository = AppDataSource.getRepository(User)
const userService = new UserService(userRepository)
const userController = new UserController(userService, logger)

router.post(
    '/',
    authenticate as RequestHandler,
    canAccess([Roles.ADMIN]),
    createUserValidator,
    (req: CreateUserRequest, res: Response, next: NextFunction) =>
        userController.create(req, res, next) as unknown as RequestHandler,
)

router.patch(
    '/:id',
    authenticate as RequestHandler,
    canAccess([Roles.ADMIN]),
    updateUserValidator,
    (req: UpdateUserRequest, res: Response, next: NextFunction) =>
        userController.update(req, res, next) as unknown as RequestHandler,
)

router.get(
    '/',
    authenticate as RequestHandler,
    canAccess([Roles.ADMIN]),
    listUsersValidator,
    (req: Request, res: Response, next: NextFunction) =>
        userController.getAll(req, res, next) as unknown as RequestHandler,
)

router.get(
    '/:id',
    authenticate as RequestHandler,
    canAccess([Roles.ADMIN]),
    (req, res, next) =>
        userController.getOne(req, res, next) as unknown as RequestHandler,
)

router.delete(
    '/:id',
    authenticate as RequestHandler,
    canAccess([Roles.ADMIN]),
    (req, res, next) =>
        userController.destroy(req, res, next) as unknown as RequestHandler,
)

export default router
