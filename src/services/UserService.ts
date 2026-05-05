import type { Repository } from 'typeorm'
import { User } from '../entity/User.js'
import type { UserData } from '../types/index.js'

export class UserService {
    constructor(private userRepository: Repository<User>) {}

    async create({
        firstName,
        lastName,
        email,
        password,
    }: UserData): Promise<User> {
        return await this.userRepository.save({
            firstName,
            lastName,
            email,
            password,
        })
    }
}
