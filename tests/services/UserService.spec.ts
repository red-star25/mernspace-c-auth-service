import { jest } from '@jest/globals'
import { Repository } from 'typeorm'
import { UserService } from '../../src/services/UserService'
import { User } from '../../src/entity/User'
import { Roles } from '../../src/constants'

describe('UserService.ensureDefaultAdmin', () => {
    let userService: UserService
    let findOne: ReturnType<typeof jest.fn>
    let save: ReturnType<typeof jest.fn>

    beforeEach(() => {
        findOne = jest.fn()
        save = jest.fn()
        const repository = { findOne, save } as unknown as Repository<User>
        userService = new UserService(repository)
    })

    const adminData = {
        firstName: 'System',
        lastName: 'Admin',
        email: 'admin@test.com',
        password: 'secret',
        role: Roles.ADMIN,
    }

    it('returns existing admin when one already exists', async () => {
        const existingAdmin = { id: 1, role: Roles.ADMIN } as User
        findOne.mockResolvedValueOnce(existingAdmin)

        const result = await userService.ensureDefaultAdmin(adminData)

        expect(result).toBe(existingAdmin)
        expect(findOne).toHaveBeenCalledWith({
            where: { role: Roles.ADMIN },
        })
        expect(save).not.toHaveBeenCalled()
    })

    it('creates admin when none exists', async () => {
        const createdAdmin = { id: 2, ...adminData } as User
        findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null)
        save.mockResolvedValueOnce(createdAdmin)

        const result = await userService.ensureDefaultAdmin(adminData)

        expect(result).toEqual(createdAdmin)
        expect(save).toHaveBeenCalled()
    })

    it('falls back to finding admin by email when create fails', async () => {
        const existingByEmail = {
            id: 3,
            email: adminData.email,
            role: Roles.ADMIN,
        } as User
        findOne
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(existingByEmail)
        save.mockRejectedValueOnce(new Error('duplicate'))

        const result = await userService.ensureDefaultAdmin(adminData)

        expect(result).toBe(existingByEmail)
        expect(findOne).toHaveBeenLastCalledWith({
            where: { email: adminData.email },
        })
    })
})
