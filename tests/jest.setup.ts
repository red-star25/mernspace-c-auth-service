import { generateKeyPairSync } from 'node:crypto'

if (!process.env.PRIVATE_KEY_PATH) {
    const { privateKey } = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    })

    process.env.PRIVATE_KEY_PATH = privateKey
}
