'use client'

import { useTheme } from 'next-themes'
import React, { useCallback } from 'react'

import { useIsClient } from 'foxact/use-is-client'

import { flushSync } from 'react-dom'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Moon, Sun, SunMoon } from 'lucide-react'
import { Button } from './ui/button'

const themes = [
  {
    label: 'System',
    value: 'system',
    icon: SunMoon
  },
  {
    label: 'Dark',
    value: 'dark',
    icon: Moon
  },
  {
    label: 'Light',
    value: 'light',
    icon: Sun
  }
]

export function ThemeSwitcher() {
  const { setTheme, theme } = useTheme()

  const currentTheme = themes.find((t) => t.value === theme) ?? themes[0]
  const isClient = useIsClient()

  const cycleTheme = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const currentIndex = themes.findIndex((t) => t.value === theme)
      const nextIndex = (currentIndex + 1) % themes.length
      // eslint-disable-next-line security/detect-object-injection -- `themes` is a constant
      const nextTheme = themes[nextIndex].value

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- `document.startViewTransition` is not always available
      if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setTheme(nextTheme)
        return
      }

      const transition = document.startViewTransition(() => {
        flushSync(() => {
          setTheme(nextTheme)
        })
      })

      const x = event.clientX
      const y = event.clientY
      const endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))

      void transition.ready.then(() => {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        const clipPath = [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`]
        document.documentElement.animate(
          {
            clipPath: clipPath
          },
          {
            duration: 600,
            easing: 'ease-in',
            pseudoElement: '::view-transition-new(root)'
          }
        )
      })
    },
    [setTheme, theme]
  )

  if (!isClient) {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="icon"
            className="group rounded-full bg-gradient-to-b from-zinc-50/50 to-white/90 px-3 py-2 shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur transition dark:from-zinc-900/50 dark:to-zinc-800/90 dark:ring-white/10 dark:hover:ring-white/20"
            onClick={cycleTheme}
          >
            <currentTheme.icon className="stroke-zinc-500 transition group-hover:stroke-zinc-700 dark:stroke-zinc-300 dark:group-hover:stroke-zinc-200" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{currentTheme.label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
