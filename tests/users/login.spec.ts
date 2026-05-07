import { describe, it, beforeAll, afterAll, beforeEach } from '@jest/globals'
import type { DataSource } from 'typeorm'
import { AppDataSource } from '../../src/config/data-source.js'

describe('POST /auth/login', () => {
    let connection: DataSource

    beforeAll(async () => {
        connection = await AppDataSource.initialize()
    })

    beforeEach(async () => {
        // Database truncate
        await connection.dropDatabase()
        await connection.synchronize()
    })

    afterAll(async () => {
        await connection.destroy()
    })

    describe('Given all fields', () => {
        it('should return the 200 status code when login', async () => {
            // // Arrange
            // const userData = {
            //     email: 'dhruv@gmail.com',
            //     password: 'password',
            // }
            // // Act
            // const response = await request(app)
            //     .post('/auth/login')
            //     .send(userData)
            // expect(response.statusCode).toBe(200)
        })
        it('should check the login credentials of user in the database', async () => {
            // // Arrange
            // const userData = {
            //     email: 'dhruv@gmail.com',
            //     password: 'password',
            // }
            // // Act
            // await request(app).post('/auth/login').send(userData)
            // const userRepository = connection.getRepository(User)
            // const users = await userRepository.findOne({
            //     where: {
            //         email: userData.email,
            //         password: userData.password,
            //     },
            // })
            // // Assert
            // expect(users).toHaveLength(1)
        })
    })
    describe('Missing fields', () => {})
    describe('Fields are not in proper format', () => {})
})
