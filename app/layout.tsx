import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Web3Provider } from '@/providers'
import { Toaster } from '@/components/ui/toaster'
const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bulletin Board',
  description: 'On-chain bulletin board'
}

export default function RootLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <Web3Provider>
          {children}
          <Toaster />
        </Web3Provider>
      </body>
    </html>
  )
}
