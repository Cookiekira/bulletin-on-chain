import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { Provider } from '@/providers'
const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bulletin Board',
  description: 'On-chain bulletin board'
}

export default function RootLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <Provider>
          {children}
          <Toaster />
        </Provider>
      </body>
    </html>
  )
}
