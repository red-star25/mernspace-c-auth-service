import bcrypt from 'bcrypt'
import type { Repository } from 'typeorm'
import { User } from '../entity/User.js'
import type { UserData } from '../types/index.js'
import logger from '../config/logger.js'
import createHttpError from 'http-errors'
import { Roles } from '../constants/index.js'

export class UserService {
    constructor(private userRepository: Repository<User>) {}

    async create({
        firstName,
        lastName,
        email,
        password,
    }: UserData): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { email: email },
        })
        if (user) {
            const err = createHttpError(400, 'Email already exists')
            throw err
        }
        // Hash password
        const saltRounds = 10
        const hashedPassword = await bcrypt.hash(password, saltRounds)
        try {
            return await this.userRepository.save({
                firstName,
                lastName,
                email,
                password: hashedPassword,
                role: Roles.CUSTOMER,
            })
        } catch (err) {
            logger.error(err)
            const error = createHttpError(
                500,
                'Failed to store the data in the database',
            )
            throw error
        }
    }

    async findByEmail(email: string) {
        const user = await this.userRepository.findOne({
            where: { email: email },
        })

        return user
    }
}
