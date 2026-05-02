'use client'

import { useEffect, useRef, useState, ReactNode } from 'react'
import { MoreHorizontal, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ActionItem {
  label: string
  icon?: LucideIcon
  /** Action click */
  onClick?: () => void
  /** Lien (alternative à onClick) */
  href?: string
  /** Style danger (texte rouge) */
  danger?: boolean
  /** Désactivé */
  disabled?: boolean
}

interface ActionMenuProps {
  items: (ActionItem | 'divider')[]
  /** Trigger custom (sinon icone MoreHorizontal) */
  trigger?: ReactNode
  /** Alignement du dropdown */
  align?: 'left' | 'right'
}

export function ActionMenu({ items, trigger, align = 'right' }: ActionMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative inline-block" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'inline-flex items-center justify-center h-8 w-8 rounded-md',
          'text-text-muted hover:text-text hover:bg-surface-2 transition-colors',
          open && 'bg-surface-2 text-text'
        )}
        aria-label="Actions"
      >
        {trigger || <MoreHorizontal className="h-4 w-4" strokeWidth={2} />}
      </button>

      {open && (
        <div
          className={cn(
            'absolute mt-1 min-w-[180px] bg-surface border border-border rounded-xl shadow-soft-xl py-1 z-50',
            'animate-slide-down',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {items.map((item, i) => {
            if (item === 'divider') {
              return <div key={`div-${i}`} className="h-px bg-border my-1" />
            }
            const Tag = item.href ? 'a' : 'button'
            return (
              <Tag
                key={i}
                href={item.href as any}
                onClick={() => {
                  if (!item.disabled) {
                    item.onClick?.()
                    setOpen(false)
                  }
                }}
                disabled={item.disabled}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors',
                  item.disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : item.danger
                    ? 'text-danger hover:bg-danger-soft'
                    : 'text-text hover:bg-surface-2'
                )}
              >
                {item.icon && <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />}
                {item.label}
              </Tag>
            )
          })}
        </div>
      )}
    </div>
  )
}
