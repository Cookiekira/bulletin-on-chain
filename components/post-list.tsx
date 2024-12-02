'use client'

import { contractConfig, type Bulletin } from '@/app/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useDeletePost, usePostStore, useInvalidatePosts, pendingNewPostsAtom } from '@/store/use-post-store'
import { formatDistanceToNow } from 'date-fns'
import { useAtom } from 'jotai'
import { ArrowUp } from 'lucide-react'
import { memo, useCallback, useState, useRef } from 'react'
import { useAccount, useWatchContractEvent } from 'wagmi'

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
  const { hasMore, fetchNextPosts, posts, postCount, address, fetchCountError } = usePostStore()
  const [pendingNewPosts, setPendingNewPosts] = useAtom(pendingNewPostsAtom)
  const [isNewPostAvailable, setNewPostAvailable] = useState(false)
  const invalidatePosts = useInvalidatePosts()
  const { toast } = useToast()
  const scrollAnchorRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const createObserver = useCallback(
    (node: HTMLDivElement) => {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            // console.log('Intersection observed')
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

  useWatchContractEvent({
    ...contractConfig,
    eventName: 'PostCreated',
    async onLogs(logs) {
      // * Check if the new post has already been fetched
      if (logs.every((log) => posts.some((post) => post.id === log.args.id))) return
      await invalidatePosts()
      // * Filter out pending posts that have been created
      setPendingNewPosts((prev) => prev.filter((post) => !logs.some((log) => log.args.identifier === post.identifier)))

      if (logs.some((log) => log.args.author === address)) {
        toast({
          title: 'Post created',
          description: 'Your post has been successfully created'
        })
      } else {
        // * Notify user of new posts from other authors
        const scrollTop = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')?.scrollTop ?? 0
        if (scrollTop > 0) setNewPostAvailable(true)
      }
    }
  })

  const handleNewPostsClick = useCallback(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' })
    setNewPostAvailable(false)
  }, [])

  if (postCount === BigInt(0) && pendingNewPosts.length === 0) {
    return (
      <ScrollArea className="mx-auto mt-8 max-h-[calc(100vh-260px)] max-w-2xl rounded-md border p-4">
        <div className="flex justify-center">
          <p className="text-gray-500">No posts yet</p>
        </div>
      </ScrollArea>
    )
  }

  return (
    <ScrollArea ref={scrollAreaRef} className="mx-auto mt-8 size-full max-w-2xl rounded-md border p-4">
      <div ref={scrollAnchorRef}>{/* An anchor to scroll to when new posts are available */}</div>

      {fetchCountError && (
        <div className="flex justify-center">
          <p className="text-destructive">Read Contract Failed</p>
        </div>
      )}

      {isNewPostAvailable && (
        <div className="sticky top-0 z-10 mb-4 flex justify-center">
          <Button variant="outline" size="sm" className="gap-2 bg-background" onClick={handleNewPostsClick}>
            <ArrowUp className="size-4" />
            New posts available
          </Button>
        </div>
      )}

      {pendingNewPosts.map((post) => (
        <PendingPost key={post.identifier} content={post.content} />
      ))}

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
    const invalidatePosts = useInvalidatePosts()

    const handleCopyAddress = useCallback(() => {
      void navigator.clipboard.writeText(post.author)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    }, [post.author])

    const handleDeletePost = useCallback(async () => {
      try {
        setIsDeletePending(true)
        await deletePost(post.id)
      } catch {
        setIsDeletePending(false)
      }
    }, [deletePost, post.id])

    useWatchContractEvent({
      ...contractConfig,
      eventName: 'PostDeleted',
      async onLogs(logs) {
        if (logs[0]?.args?.id === post.id) {
          if (isDeletePending) {
            await invalidatePosts()
          }

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
                <span className="text-xs text-gray-400">Creating post...</span>
              </div>
              <p className="italic text-gray-400">{content}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
)
