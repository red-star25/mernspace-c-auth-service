import request from 'supertest'
import app from '../../src/app.js'
import {
    describe,
    it,
    expect,
    beforeAll,
    afterAll,
    beforeEach,
} from '@jest/globals'
import type { DataSource } from 'typeorm'
import { AppDataSource } from '../../src/config/data-source.js'
import { User } from '../../src/entity/User.js'
import { Roles } from '../../src/constants/index.js'

describe('POST /auth/register', () => {
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
        it('should return the 201 status code', async () => {
            // Arrange
            const userData = {
                firstName: 'Dhruv',
                lastName: 'Nakum',
                email: 'dhruv@gmail.com',
                password: 'secret',
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            // Assert
            expect(response.statusCode).toBe(201)
        })

        it('should return valid JSON response', async () => {
            // Arrange
            const userData = {
                firstName: 'Dhruv',
                lastName: 'Nakum',
                email: 'dhruv@gmail.com',
                password: 'secret',
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            // Assert
            expect(response.headers['content-type']).toEqual(
                expect.stringContaining('json'),
            )
        })

        it('should persist the user in the database', async () => {
            // Arrange
            const userData = {
                firstName: 'Dhruv',
                lastName: 'Nakum',
                email: 'dhruv@gmail.com',
                password: 'secret',
            }

            // Act
            await request(app).post('/auth/register').send(userData)

            // Assert
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            expect(users).toHaveLength(1)
            expect(users[0]?.firstName).toBe(userData.firstName)
            expect(users[0]?.lastName).toBe(userData.lastName)
            expect(users[0]?.email).toBe(userData.email)
        })

        it('should return an id of the created user', async () => {
            const userData = {
                firstName: 'Dhruv',
                lastName: 'Nakum',
                email: 'dhruv@gmail.com',
                password: 'secret',
            }

            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            const body = response.body as { id: number }
            expect(body).toHaveProperty('id')
            expect(typeof body.id).toBe('number')

            const userRepository = connection.getRepository(User)
            const persisted = await userRepository.findOneBy({
                email: userData.email,
            })

            expect(persisted?.id).toBe(body.id)
        })

        it('should assign a customer role', async () => {
            // Arrange
            const userData = {
                firstName: 'Dhruv',
                lastName: 'Nakum',
                email: 'dhruv@gmail.com',
                password: 'secret',
            }

            // Act
            await request(app).post('/auth/register').send(userData)

            // Assert
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(users[0]).toHaveProperty('role')
            expect(users[0].role).toBe(Roles.CUSTOMER)
        })

        it('should store the hased password in the database', async () => {
            // Arrange
            const userData = {
                firstName: 'Dhruv',
                lastName: 'Nakum',
                email: 'dhruv@gmail.com',
                password: 'secret',
            }

            // Act
            await request(app).post('/auth/register').send(userData)

            // Assert
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(users[0].password).not.toBe(userData.password)
            expect(users[0].password).toHaveLength(60)
            expect(users[0].password).toMatch(/^\$2b\$\d+\$/)
        })

        it('should return 400 status code if email already exists', async () => {
            // Arrange
            const userData = {
                firstName: 'Dhruv',
                lastName: 'Nakum',
                email: 'dhruv@gmail.com',
                password: 'secret',
            }

            // Act
            const userRepository = connection.getRepository(User)
            await userRepository.save({ ...userData, role: Roles.CUSTOMER })

            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            const users = await userRepository.find()

            // Assert
            expect(response.statusCode).toBe(400)
            expect(users).toHaveLength(1)
        })
    })

    describe('Missing fields', () => {
        it('should return 400 status code if email field is missing', async () => {
            // Arrange
            const userData = {
                firstName: 'Dhruv',
                lastName: 'Nakum',
                email: '',
                password: 'secret',
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            expect(response.statusCode).toBe(400)
        })
    })
})
