import { Router } from 'express'
import { adminMiddleware } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'

export const adminRoutes = Router()

// GET /api/admin/stats
adminRoutes.get('/stats', adminMiddleware, async (req, res) => {
  try {
    const [totalWallets, totalClaims, pendingClaims, completedClaims] = await Promise.all([
      prisma.wallet.count(),
      prisma.claim.count(),
      prisma.claim.count({ where: { status: 'PENDING' } }),
      prisma.claim.count({ where: { status: 'COMPLETED' } }),
    ])

    const totalUsdt = completedClaims * (parseFloat(process.env.CLAIM_AMOUNT_USDT) || 100000)
    const totalSpcx = completedClaims * (parseFloat(process.env.CLAIM_AMOUNT_SPCX) || 2500)

    res.json({
      totalWallets,
      totalClaims,
      pendingClaims,
      completedClaims,
      totalUsdtDistributed: totalUsdt,
      totalSpcxDistributed: totalSpcx,
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to get stats' })
  }
})

// GET /api/admin/claims
adminRoutes.get('/claims', adminMiddleware, async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1
    const limit = parseInt(req.query.limit) || 20
    const skip  = (page - 1) * limit

    const [claims, total] = await Promise.all([
      prisma.claim.findMany({
        skip, take: limit,
        orderBy: { claimedAt: 'desc' },
        include: { wallet: { select: { address: true, chain: true } } },
      }),
      prisma.claim.count(),
    ])

    res.json({ claims, total, page, pages: Math.ceil(total / limit) })
  } catch (err) {
    res.status(500).json({ error: 'Failed to get claims' })
  }
})

// GET /api/admin/wallets
adminRoutes.get('/wallets', adminMiddleware, async (req, res) => {
  try {
    const wallets = await prisma.wallet.findMany({
      orderBy: { connectedAt: 'desc' },
      take: 100,
      include: { claim: true },
    })
    res.json({ wallets })
  } catch (err) {
    res.status(500).json({ error: 'Failed to get wallets' })
  }
})