import { useEffect, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'

function StatCard({ end, prefix = '', suffix = '', label, decimals = 0 }) {
  const [count, setCount] = useState(0)
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 })
  const started = useRef(false)

  useEffect(() => {
    if (!inView || started.current) return
    started.current = true
    const duration = 2000
    const steps = 60
    const stepTime = duration / steps
    let current = 0
    const timer = setInterval(() => {
      current += 1
      const value = (end / steps) * current
      setCount(parseFloat(value.toFixed(decimals)))
      if (current >= steps) {
        setCount(end)
        clearInterval(timer)
      }
    }, stepTime)
    return () => clearInterval(timer)
  }, [inView, end, decimals])

  const display = decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toLocaleString()

  return (
    <div ref={ref} className="flex flex-col items-center text-center px-6 py-8">
      <span className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-1">
        {prefix}{display}{suffix}
      </span>
      <span className="text-sm text-gray-500 font-medium">{label}</span>
    </div>
  )
}

export default function Stats() {
  return (
    <section className="border-y border-gray-100 bg-white">
      <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-gray-100">
        <StatCard end={2.4} prefix="$" suffix="B+" label="Total USDT Claimed" decimals={1} />
        <StatCard end={184000} suffix="+" label="Wallets Connected" decimals={0} />
        <StatCard end={1} suffix="B $SPCX" label="Total Token Supply" decimals={0} />
        <StatCard end={97} suffix="%" label="Claim Success Rate" decimals={0} />
      </div>
    </section>
  )
}