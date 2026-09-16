import { useEffect, useState } from 'react'
import { Users, DollarSign, CheckCircle, Clock, LogOut, RefreshCw } from 'lucide-react'

const API = import.meta.env.VITE_API_URL

export default function AdminPage() {
  const [authed, setAuthed]   = useState(false)
  const [secret, setSecret]   = useState('')
  const [error, setError]     = useState('')
  const [stats, setStats]     = useState(null)
  const [claims, setClaims]   = useState([])
  const [wallets, setWallets] = useState([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab]         = useState('stats')

  // ── restore session ───────────────────────────
  useEffect(() => {
    const saved = sessionStorage.getItem('admin_secret')
    if (saved) setSecret(saved)
  }, [])

  useEffect(() => {
    if (!authed) return
    fetchStats()
    if (tab === 'claims') fetchClaims()
    if (tab === 'wallets') fetchWallets()
  }, [authed, tab])

  // ── api calls ────────────────────────────────
  async function login(e) {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch(`${API}/api/admin/stats`, {
        headers: { 'x-admin-secret': secret },
      })
      if (!res.ok) { setError('Invalid admin secret.'); return }
      const data = await res.json()
      setStats(data)
      sessionStorage.setItem('admin_secret', secret)
      setAuthed(true)
    } catch {
      setError('Could not connect to server. Is the backend running?')
    }
  }

  async function fetchStats() {
    try {
      const s = sessionStorage.getItem('admin_secret')
      const res = await fetch(`${API}/api/admin/stats`, {
        headers: { 'x-admin-secret': s },
      })
      setStats(await res.json())
    } catch (e) {
      console.error('fetchStats error:', e)
    }
  }

  async function fetchClaims() {
    setLoading(true)
    try {
      const s = sessionStorage.getItem('admin_secret')
      const res = await fetch(`${API}/api/admin/claims?limit=50`, {
        headers: { 'x-admin-secret': s },
      })
      const data = await res.json()
      setClaims(data.claims || [])
    } catch (e) {
      console.error('fetchClaims error:', e)
    } finally {
      setLoading(false)
    }
  }

  async function fetchWallets() {
    setLoading(true)
    try {
      const s = sessionStorage.getItem('admin_secret')
      const res = await fetch(`${API}/api/admin/wallets`, {
        headers: { 'x-admin-secret': s },
      })
      const data = await res.json()
      setWallets(data.wallets || [])
    } catch (e) {
      console.error('fetchWallets error:', e)
    } finally {
      setLoading(false)
    }
  }

  function handleRefresh() {
    fetchStats()
    if (tab === 'claims') fetchClaims()
    if (tab === 'wallets') fetchWallets()
  }

  function handleLogout() {
    sessionStorage.removeItem('admin_secret')
    setAuthed(false)
    setSecret('')
    setStats(null)
    setClaims([])
    setWallets([])
  }

  // ── login screen ──────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <svg width="28" height="28" viewBox="0 0 28 28">
              <circle cx="14" cy="14" r="14" fill="#2563eb"/>
              <path d="M14 7.5C10.41 7.5 7.5 10.41 7.5 14C7.5 17.59 10.41 20.5 14 20.5C17.18 20.5 19.82 18.18 20.4 15.12H17.28C16.76 16.5 15.5 17.5 14 17.5C11.79 17.5 10 15.71 10 14C10 12.29 11.79 10.5 14 10.5C15.5 10.5 16.76 11.5 17.28 12.88H20.4C19.82 9.82 17.18 7.5 14 7.5Z" fill="white"/>
            </svg>
            <span className="font-bold text-lg">SPCXAirdrop Admin</span>
          </div>
          <form onSubmit={login} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">
                Admin Secret
              </label>
              <input
                type="password"
                value={secret}
                onChange={e => setSecret(e.target.value)}
                placeholder="Enter admin secret"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm transition-colors"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── stat cards data ───────────────────────────
  const statCards = [
    { label: 'Total Wallets',    value: stats?.totalWallets ?? 0,  icon: Users,       color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Claims',     value: stats?.totalClaims ?? 0,   icon: CheckCircle, color: 'bg-green-50 text-green-600' },
    { label: 'Pending Claims',   value: stats?.pendingClaims ?? 0, icon: Clock,       color: 'bg-yellow-50 text-yellow-600' },
    { label: 'USDT Distributed', value: `$${(stats?.totalUsdtDistributed ?? 0).toLocaleString()}`, icon: DollarSign, color: 'bg-purple-50 text-purple-600' },
  ]

  // ── dashboard ─────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-lg">
          <svg width="24" height="24" viewBox="0 0 28 28">
            <circle cx="14" cy="14" r="14" fill="#2563eb"/>
            <path d="M14 7.5C10.41 7.5 7.5 10.41 7.5 14C7.5 17.59 10.41 20.5 14 20.5C17.18 20.5 19.82 18.18 20.4 15.12H17.28C16.76 16.5 15.5 17.5 14 17.5C11.79 17.5 10 15.71 10 14C10 12.29 11.79 10.5 14 10.5C15.5 10.5 16.76 11.5 17.28 12.88H20.4C19.82 9.82 17.18 7.5 14 7.5Z" fill="white"/>
          </svg>
          SPCXAirdrop Admin
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 font-medium"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 font-medium"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
                <s.icon size={20} />
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'stats',   label: 'Overview' },
            { key: 'claims',  label: 'All Claims' },
            { key: 'wallets', label: 'Wallets' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === t.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {tab === 'stats' && stats && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4">Platform Overview</h2>
            <div className="space-y-1">
              {[
                ['Total wallets connected',  stats.totalWallets],
                ['Total claims submitted',   stats.totalClaims],
                ['Pending claims',           stats.pendingClaims],
                ['Completed claims',         stats.completedClaims],
                ['Total USDT distributed',   `$${(stats.totalUsdtDistributed || 0).toLocaleString()}`],
                ['Total $SPCX distributed',  `${(stats.totalSpcxDistributed || 0).toLocaleString()} $SPCX`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-bold text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CLAIMS TAB ── */}
        {tab === 'claims' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">All Claims</h2>
              <span className="text-xs text-gray-400">{claims.length} records</span>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-400">Loading...</div>
            ) : claims.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-gray-400">No claims yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Wallet','Chain','USDT','$SPCX','Status','Claimed At','TX Hash'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {claims.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-700">
                          {c.wallet?.address?.slice(0,8)}...{c.wallet?.address?.slice(-6)}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{c.wallet?.chain}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">${c.usdtAmount?.toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-600">{c.spcxAmount}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            c.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                            c.status === 'PENDING'   ? 'bg-yellow-100 text-yellow-700' :
                            c.status === 'FAILED'    ? 'bg-red-100 text-red-700' :
                                                       'bg-gray-100 text-gray-700'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {new Date(c.claimedAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-400">
                          {c.txHash?.slice(0, 16)}...
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── WALLETS TAB ── */}
        {tab === 'wallets' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Connected Wallets</h2>
              <span className="text-xs text-gray-400">{wallets.length} wallets</span>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-400">Loading...</div>
            ) : wallets.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-gray-400">No wallets yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Address','Chain','Connected At','Claimed'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {wallets.map(w => (
                      <tr key={w.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-700">{w.address}</td>
                        <td className="px-4 py-3 text-gray-600">{w.chain}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {new Date(w.connectedAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            w.claim
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {w.claim ? 'Yes' : 'No'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}