'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { pendingNewPostsAtom, useCreatePost } from '@/store/use-post-store'
import { useAtom } from 'jotai'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

export function PostCreate() {
  const [content, setContent] = useState('')
  const { createPost, isCreatingPost } = useCreatePost()
  const [, setPendingNewPosts] = useAtom(pendingNewPostsAtom)

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    const { identifier, mutation } = createPost(content)
    setPendingNewPosts((prev) => [{ identifier, content }, ...prev])
    try {
      await mutation
      setContent('')
    } catch {
      setPendingNewPosts((prev) => prev.filter((post) => post.identifier !== identifier))
    }
  }

  return (
    <Card className="mx-auto mt-12 w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Bulletin Board</CardTitle>
        <CardDescription>Posts on chain cannot be deleted truly. Be careful what you post!</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreatePost} className="flex gap-4">
          <Input
            required
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => {
              setContent(e.target.value)
            }}
          />
          <Button type="submit" disabled={isCreatingPost}>
            Post
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
