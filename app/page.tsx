'use client'

import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createWalletClient, custom, getContract } from 'viem'
import { sepolia } from 'viem/chains'
import BulletinABI from '../artifacts/contracts/BulletinBoard.sol/BulletinBoard.json'
import type { Bulletin } from './bulletin'

export default function Home() {
  const [content, setContent] = useState('')
  const [posts, setPosts] = useState<Bulletin[]>([])
  const { toast } = useToast()
  const BULLETIN_ADDRESS = process.env.NEXT_PUBLIC_BULLETIN_ADDRESS as `0x${string}`

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast({
        title: "Error",
        description: "Please install MetaMask to use this application",
      })
      return
    }

    const client = createWalletClient({
      chain: sepolia,
      transport: custom(window.ethereum)
    })

    const [address] = await client.requestAddresses()
    return { client, address }
  }

  const createPost = async () => {
    try {
      const { client, address } = await connectWallet() || {}
      if (!client || !address) return

      const contract = getContract({
        address: BULLETIN_ADDRESS,
        abi: BulletinABI.abi,
        client
      })

      const hash = await contract.write.createPost([content])
      
      toast({
        title: "Success",
        description: "Post created successfully!",
      })
      
      setContent('')
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive"
      })
    }
  }

  return (
    <main className="container mx-auto p-4">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Bulletin Board</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => { setContent(e.target.value); }}
            />
            <Button onClick={createPost}>Post</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
