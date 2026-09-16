import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function LegalLayout({ title, updated, children }) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* nav */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to SPCXAirdrop
          </button>
          <div className="flex items-center gap-2 font-bold text-base text-gray-900">
            <svg width="22" height="22" viewBox="0 0 28 28">
              <circle cx="14" cy="14" r="14" fill="#2563eb"/>
              <path d="M14 7.5C10.41 7.5 7.5 10.41 7.5 14C7.5 17.59 10.41 20.5 14 20.5C17.18 20.5 19.82 18.18 20.4 15.12H17.28C16.76 16.5 15.5 17.5 14 17.5C11.79 17.5 10 15.71 10 14C10 12.29 11.79 10.5 14 10.5C15.5 10.5 16.76 11.5 17.28 12.88H20.4C19.82 9.82 17.18 7.5 14 7.5Z" fill="white"/>
            </svg>
            SPCXAirdrop
          </div>
        </div>
      </div>

      {/* content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">Legal</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">{title}</h1>
          <p className="text-sm text-gray-400 mb-10 pb-8 border-b border-gray-100">Last updated: {updated}</p>

          <div className="legal-content">
            {children}
          </div>
        </div>
      </div>

      {/* footer */}
      <div className="text-center py-8 text-xs text-gray-400">
        © {new Date().getFullYear()} SPCXAirdrop. All rights reserved.
      </div>

      <style>{`
        .legal-content section { margin-bottom: 2rem; }
        .legal-content h2 { font-size: 1.125rem; font-weight: 700; color: #111827; margin-bottom: 0.75rem; }
        .legal-content p { color: #4B5563; line-height: 1.75; font-size: 0.9375rem; margin-bottom: 0.75rem; }
        .legal-content ul { list-style: disc; padding-left: 1.5rem; color: #4B5563; line-height: 1.75; font-size: 0.9375rem; }
        .legal-content ul li { margin-bottom: 0.375rem; }
        .legal-content strong { color: #111827; font-weight: 600; }
      `}</style>
    </div>
  )
}