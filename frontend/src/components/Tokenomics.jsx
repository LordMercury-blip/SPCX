import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

const allocations = [
  { label: 'Community Airdrop', pct: 40, color: '#2563eb' },
  { label: 'Liquidity Pool',    pct: 25, color: '#22c55e' },
  { label: 'Team & Advisors',   pct: 15, color: '#a855f7' },
  { label: 'Reserve Fund',      pct: 12, color: '#f59e0b' },
  { label: 'Marketing',         pct: 8,  color: '#ec4899' },
]

function DonutChart({ inView }) {
  const size = 220
  const stroke = 28
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  let offset = 0

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-lg">
      {allocations.map((a, i) => {
        const dash = (a.pct / 100) * circ
        const gap = circ - dash
        const seg = (
          <motion.circle
            key={a.label}
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={a.color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: i * 0.12 }}
            style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
          />
        )
        offset += dash
        return seg
      })}
      {/* center text */}
      <text x="50%" y="46%" textAnchor="middle" fontSize="13" fontWeight="700" fill="#111">1 Billion</text>
      <text x="50%" y="58%" textAnchor="middle" fontSize="11" fill="#6b7280">$SPCX Total</text>
    </svg>
  )
}

export default function Tokenomics() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 })

  return (
    <section className="py-20 sm:py-28 bg-gray-50" ref={ref}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-blue-600 font-semibold text-sm uppercase tracking-widest">Distribution</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">$SPCX Tokenomics</h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">1,000,000,000 $SPCX tokens distributed across the SpaceX IPO community.</p>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 justify-center">
          {/* donut */}
          <div className="flex-shrink-0">
            <DonutChart inView={inView} />
          </div>

          {/* legend */}
          <div className="flex flex-col gap-4 w-full max-w-sm">
            {allocations.map((a, i) => (
              <motion.div
                key={a.label}
                initial={{ opacity: 0, x: 20 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex items-center gap-4"
              >
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: a.color }} />
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-800">{a.label}</span>
                    <span className="text-sm font-bold text-gray-900">{a.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: a.color }}
                      initial={{ width: 0 }}
                      animate={inView ? { width: `${a.pct}%` } : {}}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}

            <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <p className="text-sm text-blue-800 font-semibold">🎯 40% allocated to community airdrop</p>
              <p className="text-xs text-blue-600 mt-1">400,000,000 $SPCX tokens available to verified wallet holders.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}