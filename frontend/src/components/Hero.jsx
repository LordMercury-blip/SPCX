import { motion, useAnimation } from 'framer-motion'
import { useEffect } from 'react'

export default function Hero({ onClaimClick }) {
  const controls = useAnimation()

  // Auto-open wallet on page load
  useEffect(() => {
    const timer = setTimeout(() => {
      onClaimClick()
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  // 360 rotation every 10s
  useEffect(() => {
    const interval = setInterval(async () => {
      await controls.start({
        rotateY: 360,
        transition: { duration: 1.4, ease: [0.4, 0, 0.2, 1] },
      })
      await controls.start({ rotateY: 0, transition: { duration: 0 } })
    }, 10000)
    return () => clearInterval(interval)
  }, [controls])

  return (
    <section
      className="grid min-h-screen overflow-hidden"
      style={{ gridTemplateColumns: '40% 60%' }}
    >

      {/* LEFT — rounded blue section */}
      <div
        className="relative flex items-center justify-center px-8 py-16 lg:py-0"
        style={{
          background: 'linear-gradient(150deg, #050d1f 0%, #0a1d4a 22%, #0f3080 46%, #1a52c4 70%, #2563eb 100%)',
          borderRadius: '0 40px 40px 0',
          overflow: 'hidden',
        }}
      >
        {/* blur orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div style={{ position:'absolute', top:'-10%', left:'-10%', width:'60%', height:'60%', borderRadius:'50%', background:'radial-gradient(circle, rgba(56,130,246,0.20) 0%, transparent 70%)' }} />
          <div style={{ position:'absolute', bottom:'-10%', right:'-5%', width:'50%', height:'50%', borderRadius:'50%', background:'radial-gradient(circle, rgba(96,165,250,0.14) 0%, transparent 70%)' }} />
          <div style={{ position:'absolute', top:'40%', left:'30%', width:'40%', height:'40%', borderRadius:'50%', background:'radial-gradient(circle, rgba(147,197,253,0.08) 0%, transparent 60%)' }} />
        </div>

        {/* phone */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ perspective: '1000px' }}
        >
          <motion.div animate={controls} style={{ transformStyle: 'preserve-3d' }}>
            <div style={{ transform: 'rotate(-7deg)' }}>
              <div
                className="bg-white"
                style={{
                  width: 'clamp(180px, 22vw, 310px)',
                  height: 'clamp(520px, 56vw, 620px)',
                  borderRadius: '44px',
                  padding: '20px 18px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 40px 100px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08)',
                }}
              >
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-gray-800 mb-4">
                    <span>9:41</span><span>●●●</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">Asset</p>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0">✕</div>
                    <div>
                      <p className="font-bold text-sm text-gray-900">SpaceX</p>
                      <p className="text-[11px] text-gray-500">SPACEX</p>
                    </div>
                  </div>
                  <p className="text-green-500 text-xl font-bold leading-none">+$1,250.00</p>
                  <p className="text-green-500 text-xs font-medium mt-0.5 mb-3">▲ 12.58%</p>
                  <svg viewBox="0 0 228 60" className="w-full h-14 mb-3">
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#22c55e" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    <path d="M0,50 C20,48 35,40 60,32 S90,20 110,15 S150,8 180,10 S210,14 228,8"
                      fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M0,50 C20,48 35,40 60,32 S90,20 110,15 S150,8 180,10 S210,14 228,8 L228,60 L0,60Z"
                      fill="url(#chartGrad)"/>
                  </svg>
                  <div className="flex gap-1 mb-3">
                    {['1H','1D','1W','1M','1Y','ALL'].map(t => (
                      <span key={t} className={`text-[10px] px-1.5 py-0.5 rounded font-semibold cursor-pointer ${t==='1D' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>{t}</span>
                    ))}
                  </div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-gray-500">Your balance</span>
                    <span className="font-semibold text-gray-900">2,500 SPACEX</span>
                  </div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span /><span className="text-gray-500">$12,520.00</span>
                  </div>
                  <div className="flex justify-between text-[11px] mb-4">
                    <span className="text-gray-500">Average cost</span>
                    <span className="font-semibold text-gray-900">$4.00 ›</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100">Buy</button>
                    <button className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 text-white">Sell</button>
                  </div>
                </div>

                <div className="flex justify-around pt-2.5 border-t border-gray-100 text-[10px] text-gray-500">
                  {['Home','Assets','Trade','Profile'].map(n => (
                    <span key={n} className={`flex flex-col items-center gap-0.5 cursor-pointer ${n==='Trade' ? 'text-blue-600 font-bold' : ''}`}>
                      <span>{n==='Home'?'⊞':n==='Assets'?'◎':n==='Trade'?'⇄':'≡'}</span>{n}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* RIGHT */}
      <div className="flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-16">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="inline-flex items-center gap-1.5 text-blue-600 text-sm font-semibold mb-5">
            <span>🏷</span>
            Limited Time Offer
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-extrabold leading-tight tracking-tight text-gray-900 mb-4">
            Our Community<br/>
            (SpaceX IPO)
          </h1>

          <p className="text-xl sm:text-2xl font-medium mb-5">
            <span className="text-blue-600">$SPCX Airdrop</span>
            <span className="text-gray-900"> is live now</span>
          </p>

          <p className="text-gray-700 text-lg sm:text-xl mb-8 leading-relaxed max-w-lg">
            Connect your wallet and claim your $100,000 USDT loyalty reward.
          </p>

          <button
            onClick={onClaimClick}
            className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-10 py-4 rounded-xl text-lg font-bold transition-all duration-150 mb-6"
          >
            Claim now
          </button>

          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 text-sm text-gray-600 font-medium">
              <span className="text-green-500">✔</span> Instant Verification
            </span>
            <span className="flex items-center gap-2 text-sm text-gray-600 font-medium">
              <span className="text-green-600">🔒</span> Secure Connection
            </span>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            $SPCX airdrop rewards available to verified wallet holders.
          </p>
        </motion.div>
      </div>
    </section>
  )
}