import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

const names = ['James O.','Sarah K.','Michael T.','Aisha N.','David L.','Priya M.','Carlos R.','Emma B.','Kwame A.','Liu W.']
const templates = [
  n => <><strong>{n}</strong> verified wallet and received <span className="text-blue-600 font-semibold">$100,000 USDT</span> loyalty reward.</>,
  n => <><strong>{n}</strong> claimed <span className="text-blue-600 font-semibold">2,500 $SPCX</span> airdrop tokens.</>,
  n => <><strong>{n}</strong> connected wallet and received <span className="text-blue-600 font-semibold">$100,000 USDT</span> reward.</>,
]

export default function LiveWidget() {
  const [visible, setVisible] = useState(true)
  const [entry, setEntry] = useState({ name: 'Harry Thompson', tmpl: 0, time: 'Just now' })
  const [secs, setSecs] = useState(0)

  useEffect(() => {
    let elapsed = 0
    const tick = setInterval(() => {
      elapsed++
      setSecs(elapsed)
    }, 60000)
    return () => clearInterval(tick)
  }, [entry])

  useEffect(() => {
    const rotate = setInterval(() => {
      const name = names[Math.floor(Math.random() * names.length)]
      const tmpl = Math.floor(Math.random() * templates.length)
      setEntry({ name, tmpl, time: 'Just now' })
      setSecs(0)
      setVisible(true)
    }, 7000)
    return () => clearInterval(rotate)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={entry.name + entry.tmpl}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35 }}
          className="fixed top-20 right-3 sm:right-5 z-40 bg-white border border-gray-200 rounded-xl shadow-lg p-3.5 w-[280px] sm:w-[310px]"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Live
            </div>
            <span className="text-[11px] text-gray-400">{secs === 0 ? 'Just now' : `${secs} min ago`}</span>
            <button onClick={() => setVisible(false)} className="text-gray-400 hover:text-gray-600 ml-1">
              <X size={14} />
            </button>
          </div>
          <p className="text-[13px] text-gray-700 leading-snug">
            {templates[entry.tmpl](entry.name)}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}