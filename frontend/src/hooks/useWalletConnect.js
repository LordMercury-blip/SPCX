// Clean wallet connect hook 
import { useConnect, useAccount, useDisconnect } from 'wagmi'

export function useWalletConnect() {
  const { connect, connectors, isPending } = useConnect()
  const { address, isConnected, chain } = useAccount()
  const { disconnect } = useDisconnect()

  // Connect using wagmi connector by name/id
  async function connectEVM(connectorId = 'injected') {
    const connector = connectors.find(c =>
      c.id.toLowerCase().includes(connectorId.toLowerCase()) ||
      c.name.toLowerCase().includes(connectorId.toLowerCase())
    ) || connectors[0]

    if (!connector) throw new Error('No connector found for: ' + connectorId)
    await connect({ connector })
  }

  // Connect TronLink — read address only, no signing
  async function connectTron() {
    if (!window.tronLink && !window.tronWeb) {
      throw new Error('TronLink is not installed.')
    }
    if (window.tronLink?.request) {
      await window.tronLink.request({ method: 'tron_requestAccounts' })
    }
    const addr =
      window.tronWeb?.defaultAddress?.base58 ||
      window.tronLink?.tronWeb?.defaultAddress?.base58
    if (!addr) throw new Error('TronLink did not return an account.')
    return addr
  }

  return {
    connectEVM,
    connectTron,
    connectors,
    isPending,
    address,
    isConnected,
    chain,
    disconnect,
  }
}