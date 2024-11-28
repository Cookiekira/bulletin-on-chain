'use client'

import { useCallback, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Bulletin, ContractConfig } from '@/app/types'
import { useAccount, useInfiniteReadContracts, useReadContract } from 'wagmi'
import type { ContractFunctionParameters } from 'viem'

const POSTS_PER_PAGE = 10

export type PostListProps = Readonly<{
  contractConfig: ContractConfig
  onDeletePostAction: (id: bigint) => Promise<void>
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
export function PostList({ contractConfig, onDeletePostAction }: PostListProps) {
  const [hasMore, setHasMore] = useState(true)
  const { address } = useAccount()

  const { data: postCount } = useReadContract({
    ...contractConfig,
    functionName: 'postCount'
  })

  const { data: postData, fetchNextPage } = useInfiniteReadContracts({
    cacheKey: 'posts',
    contracts(pageParam) {
      if (!postCount) return [] satisfies ContractFunctionParameters[]
      const start = postCount - BigInt(pageParam * POSTS_PER_PAGE)

      const posts = []
      for (let index = 0; index < POSTS_PER_PAGE; index++) {
        const postId = start - BigInt(index)
        if (postId <= 0n) break
        posts.push({
          ...contractConfig,
          functionName: 'getPost',
          args: [postId]
        })
      }

      // Hasmore is set to false when the last page is reached
      setHasMore(start > POSTS_PER_PAGE)

      return posts
    },
    query: {
      enabled: Boolean(postCount),
      initialPageParam: 0,
      getNextPageParam: (_lastPage, _allPages, lastPageParam) => {
        console.log('Last page param:', lastPageParam)
        if (postCount && (lastPageParam + 1) * POSTS_PER_PAGE >= postCount) {
          return null
        }
        return lastPageParam + 1
      }
    }
  })

  const createObserver = useCallback(
    (node: HTMLDivElement) => {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            console.log('Intersection observed')
            void fetchNextPage()
          }
        },
        {
          root: null,
          rootMargin: '0px',
          threshold: 1.0
        }
      )

      observer.observe(node)
      console.log('Observer created')

      return () => {
        observer.disconnect()
      }
    },
    [fetchNextPage, hasMore]
  )

  //@ts-expect-error - Bug in wagmi types
  const posts = (postData?.pages.flat().map((page) => page.result as Bulletin) ?? []) as Bulletin[]

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
                <Button variant="outline" size="sm" onClick={() => onDeletePostAction(post.id)}>
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
