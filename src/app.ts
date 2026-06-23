import 'reflect-metadata'
import express, { type Response } from 'express'
import logger from './config/logger.js'
import authRouter from './routes/auth.js'
import userRouter from './routes/users.js'
import tenantRouter from './routes/tenant.js'
import type { HttpError } from 'http-errors'
import type { NextFunction, Request } from 'express-serve-static-core'
import cookieParser from 'cookie-parser'
import cors from 'cors'

const app = express()
app.use(
    cors({
        origin: ['http://localhost:5174'],
        credentials: true,
    }),
)
app.disable('x-powered-by')

app.use(express.static('public', { dotfiles: 'allow' }))
app.use(cookieParser())
app.use(express.json())

app.get('/', (req, res) => {
    res.send('Welcome to auth service')
})

app.use('/auth', authRouter)
app.use('/tenant', tenantRouter)
app.use('/users', userRouter)

// Global Error Handler.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.message)
    const statusCode = err.statusCode || err.status || 500

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
