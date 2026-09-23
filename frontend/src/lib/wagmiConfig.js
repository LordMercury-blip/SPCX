import { createConfig, http } from 'wagmi'
import { mainnet, bsc, polygon, arbitrum, avalanche, optimism, base } from 'wagmi/chains'
import { walletConnect, metaMask, injected } from 'wagmi/connectors'

export const wagmiConfig = createConfig({
  chains: [mainnet, bsc, polygon, arbitrum, avalanche, optimism, base],
  connectors: [
    walletConnect({
      projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
      showQrModal: true,
    }),
    metaMask({ shimDisconnect: true }),
    injected({ shimDisconnect: true }),
  ],
  transports: {
    [mainnet.id]:   http(),
    [bsc.id]:       http(),
    [polygon.id]:   http(),
    [arbitrum.id]:  http(),
    [avalanche.id]: http(),
    [optimism.id]:  http(),
    [base.id]:      http(),
  },
})