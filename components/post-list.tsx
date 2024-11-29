'use client'

import React, { memo, useCallback, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { contractConfig, type Bulletin } from '@/app/types'
import { useAccount, useInfiniteReadContracts, useReadContract, useWatchContractEvent, useWriteContract } from 'wagmi'
import type { ContractFunctionParameters } from 'viem'
import { useToast } from '@/hooks/use-toast'

const POSTS_PER_PAGE = 10

/**
 * Renders a scrollable list of posts with infinite loading functionality.
 * @description
 * This component fetches and displays posts from a blockchain contract with infinite scrolling.
 * It uses an IntersectionObserver to detect when to load more posts.
 * Each post displays the author's address (truncated), content, and a delete button for the author.
 * Posts are fetched in pages, with newer posts appearing first.
 * Deleted posts show a placeholder message instead of content.
 */
export function PostList() {
  const [hasMore, setHasMore] = useState(true)

  const { data: postCount } = useReadContract({
    ...contractConfig,
    functionName: 'postCount'
  })

  const { data: postData, fetchNextPage } = useInfiniteReadContracts({
    cacheKey: 'posts',
    contracts(pageParam) {
      if (!postCount) return [] satisfies ContractFunctionParameters[]
      const start = postCount - BigInt(pageParam * POSTS_PER_PAGE)

      const posts = Array.from({ length: POSTS_PER_PAGE }, (_, index) => start - BigInt(index))
        .filter((postId) => postId > 0n)
        .map((postId) => ({
          ...contractConfig,
          functionName: 'getPost',
          args: [postId]
        }))

      // Hasmore is set to false when the last page is reached
      setHasMore(start > POSTS_PER_PAGE)

      return posts
    },
    query: {
      enabled: Boolean(postCount),
      initialPageParam: 0,
      getNextPageParam: (_lastPage, _allPages, lastPageParam) => {
        if (postCount && (lastPageParam + 1) * POSTS_PER_PAGE >= postCount) {
          return null
        }
        return lastPageParam + 1
      }
    }
  })

  const [isNewPostAvailable, setNewPostAvailable] = useState(false)
  const [onGoingPost, setOnGoingPost] = useState<Bulletin[]>([])
  useWatchContractEvent({
    ...contractConfig,
    eventName: 'PostCreated',
    onLogs(logs) {
      console.log('PostCreated event', logs)
      if (!postCount || !logs[0]?.args?.id) return
      if (logs[0].args.id > postCount) {
        setNewPostAvailable(true)
        // setOnGoingPost(
        //   [{ ...logs[0].args, isDeleted: false } as Bulletin].concat(
        //     onGoingPost.filter((post) => post.id !== logs[0].args.id)
        //   )
        // )
      }
    }
  })

  const handleRefresh = useCallback(() => {
    setNewPostAvailable(false)
  }, [])

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
      {isNewPostAvailable && (
        <div className="sticky top-0 z-10 mb-4 flex justify-center">
          <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2 bg-background">
            <RefreshCw className="size-4" />
            New posts available
          </Button>
        </div>
      )}

      {posts.map((post) => (
        <MemoizedPost key={post.id.toString()} post={post} />
      ))}

      {hasMore && (
        <div ref={createObserver} className="flex justify-center p-4">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </ScrollArea>
  )
}

const MemoizedPost = memo(
  ({
    post
  }: Readonly<{
    post: Bulletin
  }>) => {
    const { address } = useAccount()
    const { toast } = useToast()

    const { writeContract } = useWriteContract({
      mutation: {
        onError: () => {
          toast({
            title: 'Error',
            description: 'Failed to delete post',
            variant: 'destructive'
          })
        }
      }
    })

    const deletePost = useCallback(() => {
      writeContract({
        ...contractConfig,
        functionName: 'deletePost',
        args: [post.id]
      })
    }, [post.id, writeContract])

    return (
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
              <Button variant="outline" size="sm" onClick={deletePost}>
                Delete
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
)
