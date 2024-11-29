import '@rainbow-me/rainbowkit/styles.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConnectButton } from '@rainbow-me/rainbowkit'

import { PostList } from '@/components/post-list'
import { PostCreate } from '@/components/post-create'

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <div className="fixed right-4 top-4">
        <ConnectButton />
      </div>
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Bulletin Board</CardTitle>
        </CardHeader>
        <CardContent>
          <PostCreate />
        </CardContent>
      </Card>
      <PostList />
    </main>
  )
}
