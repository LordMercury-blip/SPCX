import { prisma } from '../lib/prisma.js'
import { v4 as uuidv4 } from 'uuid'

// POST /api/claim/submit
export async function submitClaim(req, res) {
  try {
    const { walletId, address } = req.wallet

    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
      include: { claim: true },
    })

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' })
    }

    if (wallet.claim) {
      return res.status(400).json({
        error: 'This wallet has already submitted a claim.',
        claim: wallet.claim,
      })
    }

    const claim = await prisma.claim.create({
      data: {
        walletId: wallet.id,
        usdtAmount: parseFloat(process.env.CLAIM_AMOUNT_USDT) || 100000,
        spcxAmount: parseFloat(process.env.CLAIM_AMOUNT_SPCX) || 2500,
        status: 'PENDING',
        txHash: '0x' + uuidv4().replace(/-/g, ''),
      },
    })

    // Mark as completed after 3 seconds
    setTimeout(async () => {
      try {
        await prisma.claim.update({
          where: { id: claim.id },
          data: { status: 'COMPLETED', processedAt: new Date() },
        })
      } catch (e) {
        console.error('claim status update error:', e)
      }
    }, 3000)

    res.json({
      success: true,
      claim: {
        id: claim.id,
        usdtAmount: claim.usdtAmount,
        spcxAmount: claim.spcxAmount,
        status: claim.status,
        txHash: claim.txHash,
        claimedAt: claim.claimedAt,
      },
    })
  } catch (err) {
    console.error('submitClaim error:', err)
    res.status(500).json({ error: 'Failed to submit claim' })
  }
}

// GET /api/claim/status
export async function getClaimStatus(req, res) {
  try {
    const { walletId } = req.wallet

    const claim = await prisma.claim.findUnique({ where: { walletId } })

    if (!claim) return res.json({ hasClaimed: false })

    res.json({
      hasClaimed: true,
      claim: {
        id: claim.id,
        usdtAmount: claim.usdtAmount,
        spcxAmount: claim.spcxAmount,
        status: claim.status,
        txHash: claim.txHash,
        claimedAt: claim.claimedAt,
        processedAt: claim.processedAt,
      },
    })
  } catch (err) {
    console.error('getClaimStatus error:', err)
    res.status(500).json({ error: 'Failed to get claim status' })
  }
}