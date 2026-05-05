import 'reflect-metadata'
import express, { type Response } from 'express'
import logger from './config/logger.js'
import authRouter from './routes/auth.js'
import type { HttpError } from 'http-errors'
import type { NextFunction, Request } from 'express-serve-static-core'

const app = express()

app.get('/', (req, res) => {
    res.send('Welcome to auth service')
})

app.use('/auth', authRouter)

// Global Error Handler.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.message)
    const statusCode = err.statusCode || 500

    res.status(statusCode).json({
        errors: [
            {
                type: err.name,
                msg: err.message,
                path: '',
                location: '',
            },
        ],
    })
})

export default app
