import { useNavigate } from 'react-router-dom'
import { Twitter, Send, MessageCircle, Github } from 'lucide-react'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔗 SOCIAL LINKS — replace with your real links when ready
const SOCIALS = {
  twitter:  'https://twitter.com/SPCXAirdrop',
  telegram: 'https://t.me/SPCXAirdrop',
  discord:  'https://discord.gg/SPCXAirdrop',
  github:   'https://github.com/SPCXAirdrop',
}
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function Footer({ onClaimClick }) {
  const navigate = useNavigate()

  function handleLink(e, href) {
    e.preventDefault()
    if (href.startsWith('#')) {
      const el = document.querySelector(href)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      navigate(href)
      window.scrollTo(0, 0)
    }
  }

  const links = {
    Product: [
      { label: 'Airdrop',      href: '#stats' },
      { label: 'Tokenomics',   href: '#tokenomics' },
      { label: 'How It Works', href: '#how-it-works' },
      { label: 'FAQ',          href: '#faq' },
    ],
    Community: [
      { label: 'Twitter / X', href: SOCIALS.twitter,  external: true },
      { label: 'Telegram',    href: SOCIALS.telegram, external: true },
      { label: 'Discord',     href: SOCIALS.discord,  external: true },
      { label: 'GitHub',      href: SOCIALS.github,   external: true },
    ],
    Legal: [
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy',   href: '/privacy' },
      { label: 'Cookie Policy',    href: '/cookies' },
      { label: 'Disclaimer',       href: '/disclaimer' },
    ],
  }

  return (
    <footer id="footer" className="bg-gray-950 text-gray-400">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">

          {/* brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <svg width="26" height="26" viewBox="0 0 28 28">
                <circle cx="14" cy="14" r="14" fill="#2563eb"/>
                <path d="M14 7.5C10.41 7.5 7.5 10.41 7.5 14C7.5 17.59 10.41 20.5 14 20.5C17.18 20.5 19.82 18.18 20.4 15.12H17.28C16.76 16.5 15.5 17.5 14 17.5C11.79 17.5 10 15.71 10 14C10 12.29 11.79 10.5 14 10.5C15.5 10.5 16.76 11.5 17.28 12.88H20.4C19.82 9.82 17.18 7.5 14 7.5Z" fill="white"/>
              </svg>
              <span className="text-white font-bold text-base">SPCXAirdrop</span>
            </div>
            <p className="text-sm leading-relaxed mb-5">
              The official community airdrop platform for the SpaceX IPO $SPCX token. Claim your tokens and loyalty rewards today.
            </p>
            <div className="flex gap-3">
              <a href={SOCIALS.twitter} target="_blank" rel="noreferrer"
                className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-blue-600 flex items-center justify-center transition-colors">
                <Twitter size={16} className="text-gray-300" />
              </a>
              <a href={SOCIALS.telegram} target="_blank" rel="noreferrer"
                className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-blue-500 flex items-center justify-center transition-colors">
                <Send size={16} className="text-gray-300" />
              </a>
              <a href={SOCIALS.discord} target="_blank" rel="noreferrer"
                className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-indigo-500 flex items-center justify-center transition-colors">
                <MessageCircle size={16} className="text-gray-300" />
              </a>
              <a href={SOCIALS.github} target="_blank" rel="noreferrer"
                className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-gray-600 flex items-center justify-center transition-colors">
                <Github size={16} className="text-gray-300" />
              </a>
            </div>
          </div>

          {/* link columns */}
          {Object.entries(links).map(([heading, items]) => (
            <div key={heading}>
              <h4 className="text-white font-semibold text-sm mb-4">{heading}</h4>
              <ul className="flex flex-col gap-2.5 list-none">
                {items.map(item => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      target={item.external ? '_blank' : undefined}
                      rel={item.external ? 'noreferrer' : undefined}
                      onClick={e => !item.external && handleLink(e, item.href)}
                      className="text-sm hover:text-white transition-colors cursor-pointer"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA bar */}
        <div className="border border-gray-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 bg-gray-900">
          <div>
            <p className="text-white font-bold text-lg">Ready to claim your reward?</p>
            <p className="text-gray-400 text-sm mt-0.5">Connect your wallet and claim $100,000 USDT now.</p>
          </div>
          <button
            onClick={onClaimClick}
            className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
          >
            Claim Now
          </button>
        </div>

        {/* bottom */}
        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p>© {new Date().getFullYear()} SPCXAirdrop. All rights reserved.</p>
          <p className="text-center sm:text-right max-w-md text-gray-600">
            $SPCX tokens are distributed exclusively to verified community members. Rewards are time-limited and subject to wallet verification. This is not financial advice.
          </p>
        </div>
      </div>
    </footer>
  )
}