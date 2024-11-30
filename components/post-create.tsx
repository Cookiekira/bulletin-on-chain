'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { pendingNewPostsAtom, useCreatePost } from '@/store/use-post-store'
import { useAtom } from 'jotai'

export function PostCreate() {
  const [content, setContent] = useState('')
  const { createPost, isCreatingPost } = useCreatePost()
  const [, setPendingNewPosts] = useAtom(pendingNewPostsAtom)

  const handleCreatePost = () => {
    const identifier = createPost(content)
    setPendingNewPosts((prev) => [{ identifier, content }, ...prev])
    setContent('')
  }

  return (
    <div className="flex gap-4">
      <Input
        placeholder="What's on your mind?"
        value={content}
        onChange={(e) => {
          setContent(e.target.value)
        }}
      />
      <Button onClick={handleCreatePost} disabled={isCreatingPost}>
        Post
      </Button>
    </div>
  )
}
