import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import authRoutes from './routes/auth.js'
import productRoutes from './routes/products.js'
import profileRoutes from './routes/profile.js'

dotenv.config()

const app = express()
const port = Number(process.env.PORT || 4000)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distPath = path.resolve(__dirname, '..', 'dist')
const corsOrigins = (process.env.CORS_ORIGIN || 'https://inventory-coffee.vercel.app,http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json({ limit: '10mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/profile', profileRoutes)

app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'API route not found' })
})

app.use(express.static(distPath))

app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.use((error, _req, res, next) => {
  void next
  console.error(error)
  res.status(500).json({ message: 'Internal server error' })
})

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`)
})
