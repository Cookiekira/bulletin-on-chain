'use client'

import '@rainbow-me/rainbowkit/styles.css'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { getContract } from 'viem'
import BulletinABI from '../artifacts/contracts/BulletinBoard.sol/BulletinBoard.json'
import { contractConfig } from './types'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import Loading from './loading'
import { PostList } from '@/components/post-list'

export default function Home() {
  const [content, setContent] = useState('')
  const { toast } = useToast()
  const { isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const BULLETIN_ADDRESS = process.env.NEXT_PUBLIC_BULLETIN_ADDRESS as `0x${string}`

  const createPost = async () => {
    try {
      if (!isConnected || !walletClient) {
        toast({
          title: 'Error',
          description: 'Please connect your wallet first',
          variant: 'destructive'
        })
        return
      }

      const contract = getContract({
        address: BULLETIN_ADDRESS,
        abi: BulletinABI.abi,
        client: walletClient
      })

      const hash = await contract.write.createPost([content])
      console.log('hash', hash)

      toast({
        title: 'Success',
        description: 'Post created successfully!'
      })

      setContent('')
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to create post',
        variant: 'destructive'
      })
    }
  }

  // const fetchPosts = useCallback(async () => {
  //   try {
  //     invariant(publicClient, 'Public client is not available')
  //     const contract = getContract({
  //       address: BULLETIN_ADDRESS,
  //       abi: BulletinABI.abi,
  //       client: publicClient
  //     })

  //     const postCount = (await contract.read.postCount()) as bigint
  //     const fetchedPosts: Bulletin[] = []

  //     for (let i = 1n; i <= postCount; i++) {
  //       const post = (await contract.read.getPost([i])) as Bulletin
  //       fetchedPosts.push(post)
  //     }

  //   } catch (error) {
  //     console.error('Error fetching posts:', error)
  //   }
  // }, [BULLETIN_ADDRESS, publicClient])

  const deletePost = async (id: bigint) => {
    try {
      if (!isConnected || !walletClient) {
        toast({
          title: 'Error',
          description: 'Please connect your wallet first',
          variant: 'destructive'
        })
        return
      }

      const contract = getContract({
        address: BULLETIN_ADDRESS,
        abi: BulletinABI.abi,
        client: walletClient
      })

      const hash = await contract.write.deletePost([id])
      console.log('delete hash', hash)

      toast({
        title: 'Success',
        description: 'Post deleted successfully!'
      })

      // await fetchPosts()
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete post',
        variant: 'destructive'
      })
    }
  }

  // useEffect(() => {
  //   invariant(publicClient, 'Public client is not available')
  //   // void fetchPosts()
  //   // Setup event listener for new posts
  //   const contract = getContract({
  //     address: BULLETIN_ADDRESS,
  //     abi: BulletinABI.abi,
  //     client: publicClient
  //   })

  //   const unwatch = contract.watchEvent.PostCreated({
  //     onLogs: () => {
  //       // void fetchPosts()
  //     }
  //   })

  //   return () => {
  //     unwatch()
  //   }
  // }, [BULLETIN_ADDRESS, publicClient])

  if (!publicClient) {
    return <Loading />
  }

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
          <div className="flex gap-4">
            <Input
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => {
                setContent(e.target.value)
              }}
            />
            <Button onClick={createPost}>Post</Button>
          </div>
        </CardContent>
      </Card>
      <PostList contractConfig={contractConfig} onDeletePostAction={deletePost} />
    </main>
  )
}
