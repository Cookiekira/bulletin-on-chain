'use client'

import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { hardhat, sepolia } from 'wagmi/chains'
import type { ResolvedRegister } from 'wagmi'
import { WagmiProvider } from 'wagmi'
import '@rainbow-me/rainbowkit/styles.css'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Provider } from 'jotai'

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
    },
    ...(process.env.NODE_ENV === 'development' ? [hardhat] : [])
  ]
}) as ResolvedRegister['config']

const queryClient = new QueryClient()

export function Web3Provider({ children }: { readonly children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <Provider>{children}</Provider>
        </RainbowKitProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </WagmiProvider>
  )
}
