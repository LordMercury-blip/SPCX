import { useState } from 'react'
import { Menu, X } from 'lucide-react'

const links = [
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Tokenomics',   href: '#tokenomics' },
  { label: 'Airdrop',      href: '#stats' },
  { label: 'FAQ',          href: '#faq' },
  { label: 'Community',    href: '#footer' },
]

export default function Navbar({ onConnectClick }) {
  const [menuOpen, setMenuOpen] = useState(false)

  function handleScroll(e, href) {
    e.preventDefault()
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setMenuOpen(false)
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <a href="/" className="flex items-center gap-2 font-bold text-lg text-gray-900">
            <svg width="28" height="28" viewBox="0 0 28 28">
              <circle cx="14" cy="14" r="14" fill="#0052FF"/>
              <path d="M14 7.5C10.41 7.5 7.5 10.41 7.5 14C7.5 17.59 10.41 20.5 14 20.5C17.18 20.5 19.82 18.18 20.4 15.12H17.28C16.76 16.5 15.5 17.5 14 17.5C11.79 17.5 10 15.71 10 14C10 12.29 11.79 10.5 14 10.5C15.5 10.5 16.76 11.5 17.28 12.88H20.4C19.82 9.82 17.18 7.5 14 7.5Z" fill="white"/>
            </svg>
            SPCXAirdrop
          </a>

          {/* Desktop links */}
          <ul className="hidden lg:flex items-center gap-8 list-none">
            {links.map(l => (
              <li key={l.label}>
                <a
                  href={l.href}
                  onClick={e => handleScroll(e, l.href)}
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Desktop CTA */}
          <button
            onClick={onConnectClick}
            className="hidden lg:block bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            Claim Now
          </button>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 rounded-md text-gray-700"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden pb-4 pt-2 border-t border-gray-100">
            <ul className="flex flex-col gap-1 list-none mb-4">
              {links.map(l => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    onClick={e => handleScroll(e, l.href)}
                    className="block px-2 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-600 rounded-md cursor-pointer"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
            <button
              onClick={() => { setMenuOpen(false); onConnectClick() }}
              className="w-full bg-blue-600 text-white py-3 rounded-lg text-sm font-semibold"
            >
              Claim Now
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}