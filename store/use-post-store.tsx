import type { Bulletin } from '@/app/types'
import { contractConfig } from '@/app/types'
import { useToast } from '@/hooks/use-toast'
import { nanoid } from 'nanoid'
import { useCallback } from 'react'
import { useAccount, useInfiniteReadContracts, useReadContract, useWriteContract } from 'wagmi'
import { atom, useAtom } from 'jotai'
import { useQueryClient, type QueryKey } from '@tanstack/react-query'

export const postsQueryKeyAtom = atom<QueryKey>()
export const postCountQueryKeyAtom = atom<QueryKey>()

export function usePostStore() {
  const POSTS_PER_PAGE = 10

  const { address } = useAccount()

  const { data: postCount, queryKey: postCountQueryKey } = useReadContract({
    ...contractConfig,
    functionName: 'postCount'
  })

  const {
    data: postData,
    fetchNextPage: fetchNextPosts,
    error: fetchPostsError,
    queryKey: postsQueryKey
  } = useInfiniteReadContracts({
    cacheKey: 'posts',
    contracts(pageParam) {
      return [
        {
          ...contractConfig,
          functionName: 'getPostsByPage',
          args: [BigInt(pageParam), BigInt(POSTS_PER_PAGE)]
        }
      ]
    },
    query: {
      enabled: Boolean(postCount),
      initialPageParam: 1,
      getNextPageParam: (_lastPage, _allPages, lastPageParam) => {
        if (postCount && lastPageParam * POSTS_PER_PAGE >= postCount) {
          return null
        }
        return lastPageParam + 1
      }
    }
  })

  const [_postsQueryKeyAtom, setPostsQueryKeyAtom] = useAtom(postsQueryKeyAtom)
  const [_postCountQueryKeyAtom, setPostCountQueryKeyAtom] = useAtom(postCountQueryKeyAtom)
  if (!_postsQueryKeyAtom) {
    setPostsQueryKeyAtom(postsQueryKey)
  }
  if (!_postCountQueryKeyAtom) {
    setPostCountQueryKeyAtom(postCountQueryKey)
  }

  // useWatchContractEvent({
  //   ...contractConfig,
  //   eventName: 'PostCreated',
  //   async onLogs(logs) {
  //     console.log('PostCreated event', logs)
  //     if (!postCount || !logs[0]?.args?.id) return
  //     if (logs[0].args.id > postCount) {
  //       setNewPostAvailable(true)
  //       await queryClient.invalidateQueries({ queryKey: postCountQueryKey })
  //       await queryClient.invalidateQueries({ queryKey: postsQueryKey })
  //     }
  //   }
  // })

  // @ts-expect-error - Wagmi types are incorrect
  const posts = (postData?.pages.flat().flatMap((page) => page.result as Bulletin[]) ?? []) as Bulletin[]

  const hasMore = Boolean(postCount && posts.length < Number(postCount))

  return {
    hasMore,
    postData,
    fetchNextPosts,
    postCount,
    posts,
    address,
    fetchPostsError,
    postsQueryKey,
    postCountQueryKey
  }
}

export function useCreatePost() {
  const { writeContract: createPostMutation, isPending: isCreatingPost } = useWriteContract()
  const { toast } = useToast()

  const createPost = useCallback(
    (content: string) => {
      const identifier = nanoid()
      createPostMutation(
        {
          ...contractConfig,
          functionName: 'createPost',
          args: [identifier, content]
        },
        {
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

  return { createPost, isCreatingPost }
}

export function useDeletePost() {
  const { writeContract: deletePostMutation, isPending: isDeletingPost } = useWriteContract()
  const { toast } = useToast()

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

  return { deletePost, isDeletingPost }
}

export function useInvalidatePosts() {
  const queryClient = useQueryClient()
  const [postCountQueryKey] = useAtom(postCountQueryKeyAtom)
  const [postsQueryKey] = useAtom(postsQueryKeyAtom)

  return useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: postCountQueryKey })
    await queryClient.invalidateQueries({ queryKey: postsQueryKey })
  }, [postCountQueryKey, postsQueryKey, queryClient])
}
