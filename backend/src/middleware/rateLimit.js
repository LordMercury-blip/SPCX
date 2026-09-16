import rateLimit from 'express-rate-limit'

export const claimLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 5,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const walletLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 20,
  message: { error: 'Too many requests. Please slow down.' },
})