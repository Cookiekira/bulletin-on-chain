'use client'

import { contractConfig, type Bulletin } from '@/app/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useDeletePost, usePostStore, postsQueryKeyAtom } from '@/store/use-post-store'
import { formatDistanceToNow } from 'date-fns'
import { memo, useCallback, useState } from 'react'
import { useAccount, useWatchContractEvent } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { useAtom } from 'jotai'

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
  const { hasMore, fetchNextPosts, posts } = usePostStore()

  const createObserver = useCallback(
    (node: HTMLDivElement) => {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            console.log('Intersection observed')
            void fetchNextPosts()
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
    [fetchNextPosts, hasMore]
  )

  // if (postCount === BigInt(0) && pendingPosts.length === 0) {
  //   return (
  //     <ScrollArea className="mx-auto mt-8 h-[calc(100vh-240px)] max-w-2xl rounded-md border p-4">
  //       <div className="flex justify-center">
  //         <p className="text-gray-500">No posts yet</p>
  //       </div>
  //     </ScrollArea>
  //   )
  // }

  return (
    <ScrollArea className="mx-auto mt-8 h-[calc(100vh-240px)] max-w-2xl rounded-md border p-4">
      {/* {isNewPostAvailable && (
        <div className="sticky top-0 z-10 mb-4 flex justify-center">
          <Button variant="outline" size="sm" className="gap-2 bg-background">
            <RefreshCw className="size-4" />
            New posts available
          </Button>
        </div>
      )} */}

      {/* {pendingPosts.map((post) => (
        <PendingPost key={post.identifier} content={post.content} />
      ))} */}

      {posts.map((post) => (
        <Post key={post.id.toString()} post={post} />
      ))}

      {hasMore && (
        <div ref={createObserver} className="flex justify-center p-4">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </ScrollArea>
  )
}

const Post = memo(
  ({
    post
  }: Readonly<{
    post: Bulletin
  }>) => {
    const { address } = useAccount()
    const [copied, setCopied] = useState(false)
    const { deletePost, isDeletingPost } = useDeletePost()
    const [isDeletePending, setIsDeletePending] = useState(false)
    const queryClient = useQueryClient()
    const [postsQueryKey] = useAtom(postsQueryKeyAtom)

    const handleCopyAddress = useCallback(() => {
      void navigator.clipboard.writeText(post.author)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    }, [post.author])

    const handleDeletePost = useCallback(() => {
      deletePost(post.id)
      setIsDeletePending(true)
    }, [deletePost, post.id])

    useWatchContractEvent({
      ...contractConfig,
      eventName: 'PostDeleted',
      async onLogs(logs) {
        if (logs[0]?.args?.id === post.id) {
          if (isDeletePending) await queryClient.invalidateQueries({ queryKey: postsQueryKey })
          setIsDeletePending(false)
        }
      }
    })

    return (
      <Card key={post.id.toString()} className={cn('mb-4', { 'animate-pulse': isDeletePending })}>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p
                        onClick={handleCopyAddress}
                        className="cursor-pointer text-sm text-gray-500 hover:text-gray-700"
                      >
                        {post.author.slice(0, 6)}...{post.author.slice(-4)}
                        {address === post.author && '(You)'}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{copied ? 'Copied!' : 'Click to copy address'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(Number(post.timestamp) * 1000), { addSuffix: true })}
                </span>
              </div>
              <p className={post.isDeleted || isDeletePending ? 'italic text-gray-400' : ''}>
                {isDeletePending ? 'Deleting post...' : post.isDeleted ? 'This post has been deleted' : post.content}
              </p>
            </div>
            {address === post.author && !post.isDeleted && (
              <Button variant="outline" size="sm" onClick={handleDeletePost} disabled={isDeletingPost}>
                Delete
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
)

const PendingPost = memo(
  ({
    content
  }: Readonly<{
    content: string
  }>) => {
    const { address } = useAccount()
    if (!address) return null

    return (
      <Card className="mb-4 animate-pulse">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <p className="text-sm text-gray-500">
                  {address.slice(0, 6)}...{address.slice(-4)}(You)
                </p>
                <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(), { addSuffix: true })}</span>
              </div>
              <p className="italic text-gray-400">{content}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
)
