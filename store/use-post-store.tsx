import type { Bulletin } from '@/app/types'
import { contractConfig } from '@/app/types'
import { useToast } from '@/hooks/use-toast'
import { nanoid } from 'nanoid'
import { useCallback, useEffect } from 'react'
import { useAccount, useInfiniteReadContracts, useReadContract, useWriteContract } from 'wagmi'
import { atom, useAtom } from 'jotai'
import { useQueryClient, type QueryKey } from '@tanstack/react-query'

export const postsQueryKeyAtom = atom<QueryKey>()
export const postCountQueryKeyAtom = atom<QueryKey>()
export const pendingNewPostsAtom = atom<
  {
    identifier: string
    content: string
  }[]
>([])

export function usePostStore() {
  const POSTS_PER_PAGE = 10
  const { toast } = useToast()

  const { address } = useAccount()

  const {
    data: postCount,
    queryKey: postCountQueryKey,
    error: fetchCountError
  } = useReadContract({
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

  // @ts-expect-error - Wagmi types are incorrect
  const posts = (postData?.pages.flat().flatMap((page) => page.result as Bulletin[]) ?? []) as Bulletin[]

  const hasMore = Boolean(postCount && posts.length < Number(postCount))

  useEffect(() => {
    if (fetchPostsError) {
      const message = 'shortMessage' in fetchPostsError ? fetchPostsError.shortMessage : fetchPostsError.message
      toast({
        title: fetchPostsError.name,
        description: message,
        variant: 'destructive'
      })
    }

    if (fetchCountError) {
      toast({
        title: fetchCountError.name,
        description: fetchCountError.shortMessage,
        variant: 'destructive'
      })
    }
  }, [fetchCountError, fetchPostsError, toast])

  return {
    hasMore,
    postData,
    fetchNextPosts,
    postCount,
    posts,
    address,
    fetchPostsError,
    fetchCountError,
    postsQueryKey,
    postCountQueryKey
  }
}

export function useCreatePost() {
  const { writeContractAsync: createPostMutation, isPending: isCreatingPost } = useWriteContract()
  const { toast } = useToast()

  const createPost = useCallback(
    (content: string) => {
      const identifier = nanoid()
      const mutation = createPostMutation(
        {
          ...contractConfig,
          functionName: 'createPost',
          args: [identifier, content]
        },
        {
          onError(error) {
            const message = 'shortMessage' in error ? error.shortMessage : error.message
            toast({
              title: error.name,
              description: message,
              variant: 'destructive'
            })
          }
        }
      )
      return { identifier, mutation }
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
          onError(error) {
            const message = 'shortMessage' in error ? error.shortMessage : error.message
            toast({
              title: error.name,
              description: message,
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
