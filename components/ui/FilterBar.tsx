'use client'

import { ReactNode } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from './Input'

interface FilterChip {
  label: string
  value: string
  onRemove: () => void
}

interface FilterBarProps {
  /** Search input (controlled) */
  search?: string
  onSearchChange?: (v: string) => void
  searchPlaceholder?: string
  /** Filtres custom à droite */
  filters?: ReactNode
  /** Chips de filtres actifs */
  chips?: FilterChip[]
  /** Reset all */
  onReset?: () => void
  /** Actions à droite (boutons) */
  actions?: ReactNode
  className?: string
}

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Rechercher...',
  filters,
  chips = [],
  onReset,
  actions,
  className,
}: FilterBarProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {onSearchChange && (
          <div className="flex-1 max-w-md">
            <Input
              value={search || ''}
              onChange={e => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              iconLeft={<Search className="h-3.5 w-3.5" />}
            />
          </div>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          {filters}
        </div>
        {actions && (
          <div className="ml-auto flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      {chips.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-2xs text-text-subtle uppercase tracking-wider font-medium">
            Filtres :
          </span>
          {chips.map(chip => (
            <button
              key={chip.value}
              onClick={chip.onRemove}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-electric-50 text-electric-700 text-xs font-medium ring-1 ring-electric-200 dark:bg-electric-900/30 dark:text-electric-300 dark:ring-electric-700/30 hover:bg-electric-100 transition-colors group"
            >
              {chip.label}
              <X className="h-3 w-3 opacity-60 group-hover:opacity-100" />
            </button>
          ))}
          {onReset && chips.length > 1 && (
            <button
              onClick={onReset}
              className="text-xs text-text-muted hover:text-text underline transition-colors"
            >
              Tout effacer
            </button>
          )}
        </div>
      )}
    </div>
  )
}
