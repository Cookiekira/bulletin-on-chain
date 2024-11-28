'use client'

import '@rainbow-me/rainbowkit/styles.css'
import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { getContract } from 'viem'
import BulletinABI from '../artifacts/contracts/BulletinBoard.sol/BulletinBoard.json'
import type { Bulletin } from './bulletin'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'

export default function Home() {
  const [content, setContent] = useState('')
  const [posts, setPosts] = useState<Bulletin[]>([])
  const { toast } = useToast()
  const { address, isConnected } = useAccount()
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

  const fetchPosts = useCallback(async () => {
    try {
      if (!publicClient) {
        return
      }

      const contract = getContract({
        address: BULLETIN_ADDRESS,
        abi: BulletinABI.abi,
        client: publicClient
      })

      const postCount = (await contract.read.postCount()) as bigint
      const fetchedPosts: Bulletin[] = []

      for (let i = 1n; i <= postCount; i++) {
        const post = (await contract.read.getPost([i])) as Bulletin
        fetchedPosts.push(post)
      }

      setPosts(fetchedPosts.reverse())
    } catch (error) {
      console.error('Error fetching posts:', error)
    }
  }, [BULLETIN_ADDRESS, publicClient])

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

      await fetchPosts()
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete post',
        variant: 'destructive'
      })
    }
  }

  useEffect(() => {
    void fetchPosts()
    if (!publicClient) {
      return
    }
    // Setup event listener for new posts
    const contract = getContract({
      address: BULLETIN_ADDRESS,
      abi: BulletinABI.abi,
      client: publicClient
    })

    const unwatch = contract.watchEvent.PostCreated(
      {},
      {
        onLogs: () => {
          void fetchPosts()
        }
      }
    )

    return () => {
      unwatch()
    }
  }, [BULLETIN_ADDRESS, fetchPosts, publicClient])

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
      <div className="mx-auto mt-8 max-w-2xl">
        {posts.map((post) => (
          <Card key={post.id.toString()} className="mb-4">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="mb-2 text-sm text-gray-500">
                    {post.author.slice(0, 6)}...{post.author.slice(-4)}
                  </p>
                  <p className={post.isDeleted ? 'italic text-gray-400' : ''}>
                    {post.isDeleted ? 'This post has been deleted' : post.content}
                  </p>
                </div>
                {address === post.author && !post.isDeleted && (
                  <Button variant="outline" size="sm" onClick={() => deletePost(post.id)}>
                    Delete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}
