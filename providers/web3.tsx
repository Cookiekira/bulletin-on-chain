'use client'

import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { sepolia } from 'wagmi/chains'
import { WagmiProvider } from 'wagmi'
import '@rainbow-me/rainbowkit/styles.css'

if (!process.env.NEXT_PUBLIC_PROJECT_ID) {
  throw new Error('Missing NEXT_PUBLIC_PROJECT_ID')
}

if (!process.env.NEXT_PUBLIC_RPC_URL) {
  throw new Error('Missing NEXT_PUBLIC_RPC_URL')
}

const config = getDefaultConfig({
  appName: 'Bulletin Board',
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID, // Get one from https://cloud.walletconnect.com
  chains: [
    {
      ...sepolia,
      rpcUrls: {
        default: {
          http: [process.env.NEXT_PUBLIC_RPC_URL, sepolia.rpcUrls.default.http[0]]
        }
      }
    }
  ],
  ssr: true
})

const queryClient = new QueryClient()

export function Web3Provider({ children }: { readonly children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
