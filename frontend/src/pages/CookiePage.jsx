import LegalLayout from './LegalLayout'

export default function CookiePage() {
  return (
    <LegalLayout title="Cookie Policy" updated="September 2026">
      <section>
        <h2>1. What Are Cookies</h2>
        <p>Cookies are small text files stored on your device when you visit a website. SPCXAirdrop uses minimal storage mechanisms to ensure the Platform functions correctly.</p>
      </section>
      <section>
        <h2>2. What We Use</h2>
        <p>We use the following storage mechanisms:</p>
        <ul>
          <li><strong>Session Storage:</strong> Temporarily stores your JWT authentication token and wallet connection state during your browser session. This is cleared when you close your browser tab.</li>
          <li><strong>Local Storage:</strong> May store your wallet connection preference to improve your experience on return visits.</li>
        </ul>
      </section>
      <section>
        <h2>3. What We Do Not Use</h2>
        <p>We do not use:</p>
        <ul>
          <li>Third-party tracking cookies</li>
          <li>Advertising or retargeting cookies</li>
          <li>Analytics cookies that track you across other websites</li>
          <li>Social media tracking pixels</li>
        </ul>
      </section>
      <section>
        <h2>4. Third-Party Cookies</h2>
        <p>When you connect your wallet using WalletConnect, MetaMask, or other wallet providers, those services may set their own cookies or storage items governed by their respective privacy policies.</p>
      </section>
      <section>
        <h2>5. Managing Cookies</h2>
        <p>You can clear session storage and cookies at any time through your browser settings. Note that clearing these may disconnect your wallet and require you to reconnect on your next visit.</p>
      </section>
      <section>
        <h2>6. Consent</h2>
        <p>By using the SPCXAirdrop Platform, you consent to our use of session storage as described in this policy. These are strictly necessary for the Platform to function and cannot be disabled without affecting core features.</p>
      </section>
      <section>
        <h2>7. Contact</h2>
        <p>If you have questions about our cookie usage, reach out via our official Telegram or Discord communities.</p>
      </section>
    </LegalLayout>
  )
}