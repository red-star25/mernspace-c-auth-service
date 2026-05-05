import type { Response } from 'express'
import type { RegisterUserRequest } from '../types/index.js'
import type { UserService } from '../services/UserService.js'

export class AuthController {
    constructor(private userService: UserService) {}

    async register(req: RegisterUserRequest, res: Response) {
        const { firstName, lastName, email, password } = req.body

        const user = await this.userService.create({
            firstName,
            lastName,
            email,
            password,
        })

        res.status(201).json({ id: user.id })
    }
}
