/** @type {import("jest").Config} */
export default {
    testEnvironment: 'node',
    setupFiles: ['<rootDir>/tests/jest.setup.ts'],
    extensionsToTreatAsEsm: ['.ts'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                useESM: true,
                tsconfig: 'tsconfig.jest.json',

            },
        ],
    },
    collectCoverage: true,
    coverageProvider: 'v8',
    collectCoverageFrom: [
        'src/**/*.ts',
        '!tests/**',
        '!**/node_modules/**',
    ],
    verbose: true,
}
