import type { Repository } from 'typeorm'
import { User } from '../entity/User.js'
import type { UserData } from '../types/index.js'
import logger from '../config/logger.js'
import createHttpError from 'http-errors'

export class UserService {
    constructor(private userRepository: Repository<User>) {}

    async create({
        firstName,
        lastName,
        email,
        password,
    }: UserData): Promise<User> {
        try {
            return await this.userRepository.save({
                firstName,
                lastName,
                email,
                password,
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
}
