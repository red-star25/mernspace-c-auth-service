import request from 'supertest'
import app from '../../src/app.js'
import { describe, it, expect } from '@jest/globals'

describe('POST /auth/register', () => {
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
    })

    describe('Missing fields', () => {})
})
