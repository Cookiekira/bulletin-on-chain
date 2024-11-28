'use client'

import { useCallback, useEffect, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getContract } from 'viem'
import BulletinABI from '@/artifacts/contracts/BulletinBoard.sol/BulletinBoard.json'
import type { Bulletin, ContractConfig } from '@/app/types'
import { useAccount, useInfiniteReadContracts, usePublicClient, useReadContract } from 'wagmi'
import { invariant } from 'foxact/invariant'

const POSTS_PER_PAGE = 10

export type PostListProps = Readonly<{
  contractConfig: ContractConfig
  onDeletePost: (id: bigint) => Promise<void>
}>

/**
 * Renders a scrollable list of posts with infinite loading functionality.
 * @description
 * This component fetches and displays posts from a blockchain contract with infinite scrolling.
 * It uses an IntersectionObserver to detect when to load more posts.
 * Each post displays the author's address (truncated), content, and a delete button for the author.
 * Posts are fetched in pages, with newer posts appearing first.
 * Deleted posts show a placeholder message instead of content.
 */
export function PostList({ contractConfig, onDeletePost }: PostListProps) {
  const [posts, setPosts] = useState<Bulletin[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const { address } = useAccount()
  const publicClient = usePublicClient()

  const fetchPosts = useCallback(
    async (pageNum: number) => {
      try {
        invariant(publicClient, 'Public client is not available')
        const contract = getContract({
          address: contractConfig.address,
          abi: BulletinABI.abi,
          client: publicClient
        })

        const postCount = (await contract.read.postCount()) as bigint
        const start = postCount - BigInt((pageNum - 1) * POSTS_PER_PAGE)
        const end = start - BigInt(POSTS_PER_PAGE)
        const fetchedPosts: Bulletin[] = []

        for (let i = start; i > end && i > 0n; i--) {
          console.log('Fetching post:', i, pageNum)
          const post = (await contract.read.getPost([i])) as Bulletin
          fetchedPosts.push(post)
        }

        if (pageNum === 1) {
          setPosts(fetchedPosts)
        } else {
          setPosts((prev) => [...prev, ...fetchedPosts])
        }

        setHasMore(end > 0n)
      } catch (error) {
        console.error('Error fetching posts:', error)
      }
    },
    [contractConfig.address, publicClient]
  )

  const createObserver = useCallback(
    (node: HTMLDivElement) => {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            setPage((prev) => prev + 1)
          }
        },
        {
          root: null,
          rootMargin: '20px',
          threshold: 1.0
        }
      )

      observer.observe(node)
      console.log('Observer created')

      return () => {
        observer.disconnect()
      }
    },
    [hasMore]
  )

  useEffect(() => {
    void fetchPosts(page)
  }, [fetchPosts, page])

  return (
    <ScrollArea className="mx-auto mt-8 h-[calc(100vh-240px)] max-w-2xl rounded-md border p-4">
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
                <Button variant="outline" size="sm" onClick={() => onDeletePost(post.id)}>
                  Delete
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      {hasMore && (
        <div ref={createObserver} className="flex justify-center p-4">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </ScrollArea>
  )
}
