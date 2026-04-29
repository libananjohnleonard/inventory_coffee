import { Pool } from 'pg'
import dotenv from 'dotenv'
import process from 'node:process'

dotenv.config()

export const dbSchema = process.env.DB_SCHEMA || 'coffee_inventory'

const useConnectionString = Boolean(process.env.DATABASE_URL)
const ssl =
  useConnectionString && process.env.DB_SSL !== 'false'
    ? { rejectUnauthorized: false }
    : false

export const pool = new Pool({
  ...(useConnectionString
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'inventory_coffee',
        port: Number(process.env.DB_PORT || 5432),
      }),
  max: 10,
  idleTimeoutMillis: 30000,
})
