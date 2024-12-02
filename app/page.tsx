import '@rainbow-me/rainbowkit/styles.css'
import { ConnectButton } from '@rainbow-me/rainbowkit'

import { PostList } from '@/components/post-list'
import { PostCreate } from '@/components/post-create'
import { ThemeSwitcher } from '@/components/theme-switcher'

export default function Home() {
  return (
    <main className="container mx-auto flex h-screen flex-col p-4">
      <div className="fixed right-4 top-4 flex items-center justify-end gap-5">
        <ThemeSwitcher />
        <ConnectButton />
      </div>

      <PostCreate />

      <PostList />
    </main>
  )
}
