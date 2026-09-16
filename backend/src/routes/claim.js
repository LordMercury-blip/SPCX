import { Router } from 'express'
import { submitClaim, getClaimStatus } from '../controllers/claimController.js'
import { authMiddleware } from '../middleware/auth.js'
import { claimLimiter } from '../middleware/rateLimit.js'

export const claimRoutes = Router()

claimRoutes.post('/submit', claimLimiter, authMiddleware, submitClaim)
claimRoutes.get('/status',  claimLimiter, authMiddleware, getClaimStatus)