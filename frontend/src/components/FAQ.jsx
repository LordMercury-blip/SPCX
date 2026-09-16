import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'

const faqs = [
  {
    q: 'What is the $SPCX airdrop?',
    a: 'The $SPCX airdrop is a community reward program for early supporters of the SpaceX IPO token. Eligible wallet holders can claim $SPCX tokens plus a $100,000 USDT loyalty reward by connecting their wallet.',
  },
  {
    q: 'Who is eligible to claim?',
    a: 'Any wallet holder who connects a valid EVM (Ethereum, BSC, Polygon) or TRON wallet is automatically checked for eligibility. Eligibility is based on wallet activity and the $SPCX snapshot.',
  },
  {
    q: 'How do I claim my $100,000 USDT reward?',
    a: 'Click "Claim Now", connect your wallet, and our system will automatically verify your eligibility and process your reward. The entire process takes less than 2 minutes.',
  },
  {
    q: 'Which wallets are supported?',
    a: 'We support all major EVM wallets including MetaMask, Coinbase Wallet, and WalletConnect-compatible wallets. For TRON users, TronLink and BitKeep are supported.',
  },
  {
    q: 'Is there a deadline to claim?',
    a: 'Yes — the airdrop is time-limited. We strongly recommend claiming as soon as possible as unclaimed tokens will be redistributed to the reserve fund after the deadline.',
  },
  {
    q: 'Are there any gas fees?',
    a: 'Claiming $SPCX requires a small network gas fee paid in the native currency of your chain (ETH, BNB, MATIC etc.). USDT rewards are sent directly to your wallet with no additional fees from us.',
  },
  {
    q: 'Is this safe? Is SPCXAirdrop legit?',
    a: 'Yes. SPCXAirdrop is the official community distribution platform for $SPCX tokens. We never ask for your private keys or seed phrase. Always verify you are on the correct URL before connecting your wallet.',
  },
  {
    q: 'When will tokens arrive in my wallet?',
    a: '$SPCX tokens and USDT rewards are processed immediately upon successful verification. Depending on network congestion, delivery can take between 1 and 15 minutes.',
  },
]

function FAQItem({ q, a, isOpen, onClick }) {
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-900 text-sm sm:text-base pr-4">{q}</span>
        <span className="flex-shrink-0 text-blue-600">
          {isOpen ? <Minus size={18} /> : <Plus size={18} />}
        </span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <p className="px-6 pb-5 text-gray-500 text-sm leading-relaxed border-t border-gray-50 pt-3">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FAQ() {
  const [open, setOpen] = useState(0)

  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-blue-600 font-semibold text-sm uppercase tracking-widest">Got Questions?</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">Frequently Asked Questions</h2>
        </div>
        <div className="flex flex-col gap-3">
          {faqs.map((f, i) => (
            <FAQItem
              key={i}
              q={f.q}
              a={f.a}
              isOpen={open === i}
              onClick={() => setOpen(open === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}