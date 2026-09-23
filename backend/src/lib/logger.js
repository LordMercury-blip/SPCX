// Clean logger — logs app events only
import { createWriteStream, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const logDir = join(__dirname, '../../../logs')

// Create logs directory if it doesn't exist
if (!existsSync(logDir)) {
  try { mkdirSync(logDir, { recursive: true }) } catch (e) { /* ignore */ }
}

function timestamp() {
  return new Date().toISOString()
}

function formatLine(level, message, meta = {}) {
  const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : ''
  return `[${timestamp()}] [${level.toUpperCase()}] ${message}${metaStr}\n`
}

export const logger = {
  info(message, meta = {}) {
    const line = formatLine('info', message, meta)
    process.stdout.write(line)
  },

  warn(message, meta = {}) {
    const line = formatLine('warn', message, meta)
    process.stderr.write(line)
  },

  error(message, meta = {}) {
    const line = formatLine('error', message, meta)
    process.stderr.write(line)
  },

  // Log wallet connection events (address only — no balance or token data)
  walletConnected(address, chain) {
    this.info('Wallet connected', { address, chain })
  },

  // Log claim submissions
  claimSubmitted(walletId, status) {
    this.info('Claim submitted', { walletId, status })
  },
}

export default logger