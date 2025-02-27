// index.ts
import { startServer } from './server/server'

// eslint-disable-next-line no-undef
const API_PORT = process.env.API_PORT as unknown as number
startServer(API_PORT)
