import { Router } from 'express'
import { connectWallet, getWalletStatus } from '../controllers/walletController.js'
import { authMiddleware } from '../middleware/auth.js'
import { walletLimiter } from '../middleware/rateLimit.js'

export const walletRoutes = Router()

walletRoutes.post('/connect', walletLimiter, connectWallet)
walletRoutes.get('/status',  walletLimiter, authMiddleware, getWalletStatus)