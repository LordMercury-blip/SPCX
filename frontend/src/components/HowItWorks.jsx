import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Wallet, ShieldCheck, BadgeDollarSign } from 'lucide-react'

const steps = [
  {
    icon: Wallet,
    step: '01',
    title: 'Connect Your Wallet',
    desc: 'Connect your EVM or TRON wallet securely. We support MetaMask, Coinbase Wallet, WalletConnect, TronLink and more.',
    color: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    icon: ShieldCheck,
    step: '02',
    title: 'Verify Eligibility',
    desc: 'Our system automatically verifies your wallet address against the $SPCX airdrop snapshot. Verification takes seconds.',
    color: 'bg-green-50',
    iconColor: 'text-green-600',
  },
  {
    icon: BadgeDollarSign,
    step: '03',
    title: 'Claim Your Reward',
    desc: 'Once verified, claim your $SPCX tokens and $100,000 USDT loyalty reward directly to your connected wallet.',
    color: 'bg-purple-50',
    iconColor: 'text-purple-600',
  },
]

export default function HowItWorks({ onClaimClick }) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.15 })

  return (
    <section className="py-20 sm:py-28 bg-white" ref={ref}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-blue-600 font-semibold text-sm uppercase tracking-widest">Simple Process</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">How to Claim Your Airdrop</h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">Three simple steps to claim your $SPCX tokens and $100,000 USDT loyalty reward.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative flex flex-col items-center text-center p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* connector line */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[calc(100%-1rem)] w-8 h-px bg-gray-200 z-10" />
              )}
              <div className={`w-16 h-16 rounded-2xl ${s.color} flex items-center justify-center mb-5`}>
                <s.icon size={28} className={s.iconColor} />
              </div>
              <span className="text-xs font-bold text-gray-300 tracking-widest mb-2">STEP {s.step}</span>
              <h3 className="text-lg font-bold text-gray-900 mb-3">{s.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12">
          <button
            onClick={onClaimClick}
            className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-xl font-bold text-base transition-all active:scale-95 shadow-lg shadow-blue-100"
          >
            Claim Now
          </button>
        </div>
      </div>
    </section>
  )
}