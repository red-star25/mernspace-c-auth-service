import { checkSchema } from 'express-validator'

export default checkSchema({
    email: {
        errorMessage: 'Email is required!',
        notEmpty: true,
        trim: true,
        isEmail: {
            errorMessage: 'Email should be a valid email',
        },
    },
    firstName: {
        errorMessage: 'First name is required!',
        notEmpty: true,
        trim: true,
    },
    lastName: {
        errorMessage: 'Last name is required!',
        notEmpty: true,
        trim: true,
    },
    password: {
        errorMessage: 'Password is required!',
        notEmpty: true,
        trim: true,
        isLength: {
            options: { min: 8 },
            errorMessage: 'Password must be at least 8 characters long',
        },
    },
})
