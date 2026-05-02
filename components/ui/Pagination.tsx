'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  /** Page actuelle (1-indexée) */
  page: number
  /** Nombre total de pages */
  totalPages: number
  /** Total d'items (affichage info) */
  total?: number
  /** Items par page (affichage info) */
  pageSize?: number
  onPageChange: (page: number) => void
  /** Mode compact (juste prev/next + indicator) */
  compact?: boolean
  className?: string
}

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  compact = false,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const canPrev = page > 1
  const canNext = page < totalPages

  // Génère les pages visibles : [1, 2, 3, ..., last]
  const getPagesArr = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const arr: (number | 'ellipsis')[] = [1]
    if (page > 3) arr.push('ellipsis')
    const start = Math.max(2, page - 1)
    const end = Math.min(totalPages - 1, page + 1)
    for (let i = start; i <= end; i++) arr.push(i)
    if (page < totalPages - 2) arr.push('ellipsis')
    arr.push(totalPages)
    return arr
  }

  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      {/* Info à gauche */}
      <div className="text-xs text-text-muted nums-tabular">
        {total !== undefined && pageSize !== undefined ? (
          <>
            <span className="font-medium text-text">
              {(page - 1) * pageSize + 1}
            </span>
            {' – '}
            <span className="font-medium text-text">
              {Math.min(page * pageSize, total)}
            </span>
            {' sur '}
            <span className="font-medium text-text">{total}</span>
          </>
        ) : (
          <>Page {page} / {totalPages}</>
        )}
      </div>

      {/* Pages */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => canPrev && onPageChange(page - 1)}
          disabled={!canPrev}
          className={cn(
            'inline-flex items-center justify-center h-8 w-8 rounded-md text-sm',
            'border border-border bg-surface text-text-muted',
            'hover:bg-surface-2 hover:text-text transition-colors',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface'
          )}
          aria-label="Page précédente"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {!compact && getPagesArr().map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`e-${i}`} className="px-1 text-text-subtle text-xs">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                'inline-flex items-center justify-center h-8 min-w-[32px] px-2 rounded-md text-xs font-medium transition-colors',
                p === page
                  ? 'bg-ink-700 text-white shadow-soft dark:bg-white dark:text-ink-900'
                  : 'text-text-muted hover:bg-surface-2 hover:text-text'
              )}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => canNext && onPageChange(page + 1)}
          disabled={!canNext}
          className={cn(
            'inline-flex items-center justify-center h-8 w-8 rounded-md text-sm',
            'border border-border bg-surface text-text-muted',
            'hover:bg-surface-2 hover:text-text transition-colors',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface'
          )}
          aria-label="Page suivante"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
