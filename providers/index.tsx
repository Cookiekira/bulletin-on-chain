'use client'

import { darkTheme, getDefaultConfig, lightTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { hardhat, sepolia } from 'wagmi/chains'
import type { ResolvedRegister } from 'wagmi'
import { WagmiProvider } from 'wagmi'
import '@rainbow-me/rainbowkit/styles.css'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider, useTheme } from 'next-themes'
import { Provider as JotaiProvider } from 'jotai'
import { useIsClient } from 'foxact/use-is-client'

const chains: ResolvedRegister['config']['chains'] = [
  {
    ...sepolia,
    rpcUrls: {
      default: {
        http: process.env.NEXT_PUBLIC_RPC_URL
          ? [process.env.NEXT_PUBLIC_RPC_URL, ...sepolia.rpcUrls.default.http]
          : sepolia.rpcUrls.default.http
      }
    }
  }
]

if (process.env.NODE_ENV === 'development') {
  // @ts-expect-error - For development purposes only
  chains.push(hardhat)
}

const config = getDefaultConfig({
  appName: 'Bulletin Board',
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID ?? '', // Get one from https://cloud.walletconnect.com
  chains: chains
})

const queryClient = new QueryClient()

export function Web3Provider({ children }: { readonly children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()
  const isClient = useIsClient()
  // Fix hydration mismatch
  const renderTheme = isClient ? (resolvedTheme === 'light' ? lightTheme() : darkTheme()) : undefined
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={renderTheme}>
          <JotaiProvider>{children}</JotaiProvider>
        </RainbowKitProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export function Provider({ children }: { readonly children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class">
      <Web3Provider>{children}</Web3Provider>
    </ThemeProvider>
  )
}
