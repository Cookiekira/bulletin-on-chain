import type { Bulletin } from '@/app/types'
import { contractConfig } from '@/app/types'
import { useToast } from '@/hooks/use-toast'
import { useCallback, useState } from 'react'
import { useInfiniteReadContracts, useReadContract, useWatchContractEvent, useWriteContract } from 'wagmi'
import type { ContractFunctionParameters } from 'viem'

export function usePostStore() {
  const POSTS_PER_PAGE = 10

  const { toast } = useToast()

  const [hasMore, setHasMore] = useState(true)

  const { data: postCount } = useReadContract({
    ...contractConfig,
    functionName: 'postCount'
  })

  const {
    data: postData,
    fetchNextPage: fetchNextPosts,
    error: fetchPostsError,
    refetch: refetchPosts
  } = useInfiniteReadContracts({
    cacheKey: 'posts',
    contracts(pageParam) {
      if (!postCount) return [] satisfies ContractFunctionParameters[]
      const start = postCount - BigInt(pageParam * POSTS_PER_PAGE)

      const posts = Array.from({ length: POSTS_PER_PAGE }, (_, index) => start - BigInt(index))
        .filter((postId) => postId > 0n)
        .map(
          (postId) =>
            ({
              ...contractConfig,
              functionName: 'getPost',
              args: [postId]
            }) satisfies ContractFunctionParameters
        )

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

  if (fetchPostsError) {
    toast({
      title: 'Error',
      description: 'Failed to fetch posts',
      variant: 'destructive'
    })
  }

  const [isNewPostAvailable, setNewPostAvailable] = useState(false)
  useWatchContractEvent({
    ...contractConfig,
    eventName: 'PostCreated',
    onLogs(logs) {
      // console.log('PostCreated event', logs)
      if (!postCount || !logs[0]?.args?.id) return
      if (logs[0].args.id > postCount) {
        setNewPostAvailable(true)
      }
    }
  })

  // @ts-expect-error - Wagmi types are incorrect
  const posts = (postData?.pages.flat().map((page) => page.result as Bulletin) ?? []) as Bulletin[]

  const { writeContract: createPostMutation, isPending: isCreatingPost } = useWriteContract()
  const { writeContract: deletePostMutation, isPending: isDeletingPost } = useWriteContract()

  const createPost = useCallback(
    (content: string) => {
      createPostMutation(
        {
          ...contractConfig,
          functionName: 'createPost',
          args: [content]
        },
        {
          // onSuccess(data, variables) {
          //   const optimisticPost = {
          //     id: BigInt('0x' + window.crypto.randomUUID().replace(/-/g, '')),
          //     content: variables.args[0] || '',
          //     timestamp: BigInt(Date.now()),
          //     author: data,
          //     isDeleted: false
          //   } satisfies Bulletin
          // },
          onError() {
            toast({
              title: 'Error',
              description: 'Failed to create post',
              variant: 'destructive'
            })
          }
        }
      )
    },
    [createPostMutation, toast]
  )

  const deletePost = useCallback(
    (id: bigint) => {
      deletePostMutation(
        {
          ...contractConfig,
          functionName: 'deletePost',
          args: [id]
        },
        {
          onError() {
            toast({
              title: 'Error',
              description: 'Failed to delete post',
              variant: 'destructive'
            })
          }
        }
      )
    },
    [deletePostMutation, toast]
  )

  return {
    createPost,
    isCreatingPost,
    deletePost,
    isDeletingPost,
    hasMore,
    setHasMore,
    postData,
    fetchNextPosts,
    postCount,
    posts,
    refetchPosts,
    isNewPostAvailable
  }
}
