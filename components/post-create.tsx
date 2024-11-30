'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { usePostStore } from '@/store/use-post-store'

export function PostCreate() {
  const [content, setContent] = useState('')
  const { createPost } = usePostStore()

  const handleCreatePost = () => {
    createPost(content)
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
      <Button onClick={handleCreatePost}>Post</Button>
    </div>
  )
}
