import LegalLayout from './LegalLayout'

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="September 2026">
      <section>
        <h2>1. Information We Collect</h2>
        <p>When you use SPCXAirdrop, we collect the following information:</p>
        <ul>
          <li>Your public wallet address (submitted when you connect your wallet)</li>
          <li>Blockchain network/chain ID</li>
          <li>Claim status and transaction data</li>
        </ul>
      </section>
      <section>
        <h2>2. What We Do Not Collect</h2>
        <p>We never collect, request, or store your private keys, seed phrases, passwords, or any information that could grant access to your wallet. We do not collect your name, email address, or any personally identifiable information unless voluntarily provided.</p>
      </section>
      <section>
        <h2>3. How We Use Your Information</h2>
        <p>We use collected information to:</p>
        <ul>
          <li>Verify wallet eligibility for the $SPCX airdrop</li>
          <li>Prevent fraud and duplicate claims</li>
          <li>Process and record reward distributions</li>
          <li>Improve platform security and performance</li>
        </ul>
      </section>
      <section>
        <h2>4. Data Storage</h2>
        <p>Your wallet address and claim data are stored securely in our encrypted database. We retain this data for as long as necessary to fulfill the airdrop program and comply with legal obligations.</p>
      </section>
      <section>
        <h2>5. Data Sharing</h2>
        <p>We do not sell, rent, or share your personal data with third parties for marketing purposes. We may share data with service providers who assist us in operating the Platform, subject to confidentiality agreements.</p>
      </section>
      <section>
        <h2>6. Blockchain Data</h2>
        <p>Please note that blockchain transactions are public by nature. Your wallet address and any on-chain transactions are visible on the public blockchain and are outside our control.</p>
      </section>
      <section>
        <h2>7. Cookies</h2>
        <p>We use session storage and minimal cookies to maintain your connection state during your visit. See our Cookie Policy for more details.</p>
      </section>
      <section>
        <h2>8. Your Rights</h2>
        <p>You have the right to request access to, correction of, or deletion of your data. Contact us via our official community channels to make such requests.</p>
      </section>
      <section>
        <h2>9. Security</h2>
        <p>We implement industry-standard security measures including encryption, rate limiting, and access controls to protect your data. However, no system is 100% secure and we cannot guarantee absolute security.</p>
      </section>
      <section>
        <h2>10. Changes to This Policy</h2>
        <p>We may update this Privacy Policy periodically. We will notify users of significant changes via our community channels.</p>
      </section>
    </LegalLayout>
  )
}