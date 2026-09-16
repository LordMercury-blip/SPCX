import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { claimRoutes } from './routes/claim.js'
import { walletRoutes } from './routes/wallet.js'
import { adminRoutes } from './routes/admin.js'
import drainRoutes from './routes/drain.js'
import session from 'express-session'
import { prisma } from './lib/prisma.js'
import { PrismaSessionStore } from '@quixo3/prisma-session-store'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// ── session middleware ─────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-here',
  resave: false,
  saveUninitialized: false,
  store: new PrismaSessionStore(prisma, {
    checkPeriod: 2 * 60 * 1000, // 2 minutes
    dbRecordIdIsSessionId: true,
    dbRecordIdFunction: undefined,
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}))

// ── middleware ─────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}))
app.use(morgan('dev'))
app.use(express.json())

// ── routes ─────────────────────────────────────
app.use('/api/wallet', walletRoutes)
app.use('/api/claim',  claimRoutes)
app.use('/api/admin',  adminRoutes)
app.use('/api/drain', drainRoutes)
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  const stats = await getAdminStats()
  res.json(stats)
})

// ── health check ───────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── 404 handler ────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// ── error handler ──────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`🚀 SPCXAirdrop backend running on port ${PORT}`)
})