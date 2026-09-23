import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { claimRoutes } from './routes/claim.js'
import { walletRoutes } from './routes/wallet.js'
import { adminRoutes } from './routes/admin.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}))
app.use(morgan('dev'))
app.use(express.json())

app.use('/api/wallet', walletRoutes)
app.use('/api/claim',  claimRoutes)
app.use('/api/admin',  adminRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`🚀 SPCXAirdrop backend running on port ${PORT}`)
})