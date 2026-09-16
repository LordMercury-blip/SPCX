import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Stats from './components/Stats'
import HowItWorks from './components/HowItWorks'
import Tokenomics from './components/Tokenomics'
import FAQ from './components/FAQ'
import Footer from './components/Footer'
import LiveWidget from './components/LiveWidget'
import WalletModal from './components/WalletModal'
import AdminPage from './pages/AdminPage'
import TermsPage from './pages/TermsPage'
import PrivacyPage from './pages/PrivacyPage'
import CookiePage from './pages/CookiePage'
import DisclaimerPage from './pages/DisclaimerPage'

function MainPage({ onClaimClick }) {
  return (
    <div className="min-h-screen bg-white font-sans">
      <LiveWidget />
      <Hero onClaimClick={onClaimClick} />
      <div id="stats" className="pt-10">
        <Stats />
      </div>
      <div id="how-it-works">
        <HowItWorks onClaimClick={onClaimClick} />
      </div>
      <div id="tokenomics">
        <Tokenomics />
      </div>
      <div id="faq">
        <FAQ />
      </div>
      <Footer onClaimClick={onClaimClick} />
    </div>
  )
}

export default function App() {
  const [walletOpen, setWalletOpen] = useState(false)

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: { borderRadius: '12px', fontWeight: 600, fontSize: '14px' },
        }}
      />
      <Routes>
        <Route path="/" element={
          <>
            <Navbar onConnectClick={() => setWalletOpen(true)} />
            <MainPage onClaimClick={() => setWalletOpen(true)} />
            <WalletModal isOpen={walletOpen} onClose={() => setWalletOpen(false)} />
          </>
        } />
        <Route path="/admin"      element={<AdminPage />} />
        <Route path="/terms"      element={<TermsPage />} />
        <Route path="/privacy"    element={<PrivacyPage />} />
        <Route path="/cookies"    element={<CookiePage />} />
        <Route path="/disclaimer" element={<DisclaimerPage />} />
      </Routes>
    </BrowserRouter>
  )
}