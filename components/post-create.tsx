'use client'

import { useCallback, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useWriteContract } from 'wagmi'
import { contractConfig } from '@/app/types'

export function PostCreate() {
  const [content, setContent] = useState('')
  const { toast } = useToast()

  const { writeContract } = useWriteContract({
    mutation: {
      onError: () => {
        toast({
          title: 'Error',
          description: 'Failed to create post',
          variant: 'destructive'
        })
      }
    }
  })
  const createPost = useCallback(() => {
    writeContract({
      ...contractConfig,
      functionName: 'createPost',
      args: [content]
    })
  }, [content, writeContract])

  return (
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
  )
}
