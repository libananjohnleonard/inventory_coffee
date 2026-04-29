import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import process from 'node:process'

dotenv.config()

const useConnectionString = Boolean(process.env.DATABASE_URL)
const ssl =
  useConnectionString && process.env.DB_SSL !== 'false'
    ? { rejectUnauthorized: false }
    : false

const pool = new Pool(
  useConnectionString
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
      },
)

async function setupDatabase() {
  try {
    console.log('🔄 Starting database setup...')

    // Read SQL schema file
    const schemaPath = path.join(process.cwd(), 'sql', 'coffee_inventory_schema.sql')
    const sql = fs.readFileSync(schemaPath, 'utf-8')

    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter((stmt) => stmt.trim())

    for (const statement of statements) {
      await pool.query(statement)
    }

    console.log('✅ Database setup completed successfully!')
    console.log('📋 Tables created: admin_users, products')
    console.log('👤 Default admin: brix@gmail.com / 1234')
    console.log('☕ Sample coffee products added')

    await pool.end()
  } catch (error) {
    console.error('❌ Database setup failed:', error.message)
    await pool.end()
    process.exit(1)
  }
}

setupDatabase()
