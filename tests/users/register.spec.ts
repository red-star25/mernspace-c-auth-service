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
import { isJWT } from '../utils/index.js'
import { RefreshToken } from '../../src/entity/RefreshToken.js'

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
                password: 'password',
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
                password: 'password',
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
                password: 'password',
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
                password: 'password',
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
                password: 'password',
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
                password: 'password',
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
                password: 'password',
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

        it('should return the access token and refresh token inside a cookie', async () => {
            // Arrange
            const userData = {
                firstName: 'Dhruv',
                lastName: 'Nakum',
                email: 'dhruv@gmail.com',
                password: 'password',
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            // Assert
            function cookieHeaderToList(value: unknown): string[] {
                if (Array.isArray(value)) {
                    return value.filter(
                        (item): item is string => typeof item === 'string',
                    )
                }
                if (typeof value === 'string') {
                    return [value]
                }
                return []
            }

            function cookieValue(
                cookies: string[],
                name: string,
            ): string | undefined {
                const prefix = `${name}=`
                const cookie = cookies.find((c) => c.startsWith(prefix))
                if (!cookie) return undefined
                const firstPart = cookie.split(';')[0]
                if (!firstPart.startsWith(prefix)) return undefined
                return firstPart.slice(prefix.length)
            }

            const cookies = cookieHeaderToList(response.headers['set-cookie'])
            let accessToken = cookieValue(cookies, 'accessToken')
            let refreshToken = cookieValue(cookies, 'refreshToken')

            cookies.forEach((cookie: string) => {
                if (cookie.startsWith('accessToken=')) {
                    accessToken = cookie.split(';')[0].split('=')[1]
                }

                if (cookie.startsWith('refreshTokeb=')) {
                    refreshToken = cookie.split(';')[0].split('=')[1]
                }
            })

            expect(accessToken).toBeDefined()
            expect(refreshToken).toBeDefined()

            expect(isJWT(accessToken as string)).toBeTruthy()
            expect(isJWT(refreshToken as string)).toBeTruthy()
        })

        it('should store the request token in the database', async () => {
            // Arrange
            const userData = {
                firstName: 'Dhruv',
                lastName: 'Nakum',
                email: 'dhruv@gmail.com',
                password: 'password',
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            // Assert
            const refreshTokenRepo = connection.getRepository(RefreshToken)
            // const refreshTokens = await refreshTokenRepo.find()
            // expect(refreshTokens).toHaveLength(1)

            const tokens = await refreshTokenRepo
                .createQueryBuilder('refreshToken')
                .where('refreshToken.userId = :userId', {
                    userId: (response.body as Record<string, string>).id,
                })
                .getMany()

            expect(tokens).toHaveLength(1)
        })
    })

    describe('Missing fields', () => {
        it('should return 400 status code if email field is missing', async () => {
            // Arrange
            const userData = {
                firstName: 'Dhruv',
                lastName: 'Nakum',
                email: '',
                password: 'password',
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            expect(response.statusCode).toBe(400)
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(users).toHaveLength(0)
        })

        it('should return 400 status code if firstName is missing', async () => {
            // Arrange
            const userData = {
                firstName: '',
                lastName: 'Nakum',
                email: 'dhruv@gmail.com',
                password: 'password',
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            expect(response.statusCode).toBe(400)
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(users).toHaveLength(0)
        })

        it('should return 400 status code if lastName is missing', async () => {
            // Arrange
            const userData = {
                firstName: 'Dhruv',
                lastName: '',
                email: 'dhruv@gmail.com',
                password: 'password',
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            expect(response.statusCode).toBe(400)
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(users).toHaveLength(0)
        })

        it('should return 400 status code if password is missing', async () => {
            // Arrange
            const userData = {
                firstName: 'Dhruv',
                lastName: 'Nakum',
                email: 'dhruv@gmail.com',
                password: '',
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            expect(response.statusCode).toBe(400)
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(users).toHaveLength(0)
        })
    })

    describe('Fields are not in proper format', () => {
        it('should trim the email field', async () => {
            // Arrange
            const userData = {
                firstName: 'Dhruv',
                lastName: 'Nakum',
                email: ' dhruv@gmail.com ',
                password: 'password',
            }
            // Act
            await request(app).post('/auth/register').send(userData)

            // Assert
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            const user = users[0]
            expect(user.email).toBe('dhruv@gmail.com')
        })

        it('should return 400 status code if the email is not a valid email', async () => {
            // Arrange
            const userData = {
                firstName: 'Dhruv',
                lastName: 'Nakum',
                email: 'dhruvgmail.com',
                password: 'password',
            }
            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            // Assert
            expect(response.statusCode).toBe(400)
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(users).toHaveLength(0)
        })

        it('should return 400 status code if the password length is less than 8 characters', async () => {
            // Arrange
            const userData = {
                firstName: 'Dhruv',
                lastName: 'Nakum',
                email: 'dhruv@gmail.com',
                password: 'pass',
            }
            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            // Assert
            expect(response.statusCode).toBe(400)
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(users).toHaveLength(0)
        })
        it('shoud return an array of error messages if email is missing', async () => {
            // Arrange
            const userData = {
                firstName: 'Dhruv',
                lastName: 'Nakum',
                email: '',
                password: 'pass',
            }
            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            // Assert
            expect(response.body).toHaveProperty('errors')
            expect(
                (response.body as Record<string, string>).errors.length,
            ).toBeGreaterThan(0)
        })
    })
})
