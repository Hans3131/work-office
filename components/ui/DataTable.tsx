'use client'

import { useState, useMemo, ReactNode } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from './Skeleton'
import { EmptyState } from './EmptyState'

export interface Column<T> {
  /** Clé d'identification de la colonne (utilisée pour le tri) */
  key: string
  /** Libellé affiché dans le header */
  header: ReactNode
  /** Render custom de la cellule (si omis, accède à row[key]) */
  render?: (row: T) => ReactNode
  /** Valeur utilisée pour le tri (si omis, fallback sur row[key]) */
  sortValue?: (row: T) => string | number | Date
  /** Active le tri sur cette colonne */
  sortable?: boolean
  /** Alignement de la cellule */
  align?: 'left' | 'center' | 'right'
  /** Largeur fixe (ex: '120px', '20%') */
  width?: string
  /** Classes additionnelles sur la cellule */
  className?: string
  /** Header sticky en haut au scroll */
  sticky?: boolean
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  /** Clé unique sur la row (default: 'id') */
  keyField?: keyof T
  /** Loading state -> skeleton rows */
  loading?: boolean
  /** Nombre de skeleton rows en loading */
  loadingRows?: number
  /** Callback au clic sur une ligne */
  onRowClick?: (row: T) => void
  /** Sélection multiple */
  selectable?: boolean
  /** Callback de changement de sélection */
  onSelectionChange?: (selectedIds: string[]) => void
  /** Empty state customisé (sinon défaut) */
  empty?: ReactNode
  /** Texte du empty state par défaut */
  emptyTitle?: string
  emptyDescription?: string
  /** Classes container */
  className?: string
  /** Hauteur max avec scroll interne */
  maxHeight?: string
  /** Sticky header */
  stickyHeader?: boolean
}

export function DataTable<T extends { id?: string }>({
  columns,
  data,
  keyField = 'id' as keyof T,
  loading = false,
  loadingRows = 5,
  onRowClick,
  selectable = false,
  onSelectionChange,
  empty,
  emptyTitle = 'Aucune donnée',
  emptyDescription = 'Il n\'y a rien à afficher pour le moment.',
  className,
  maxHeight,
  stickyHeader = true,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Sort data localement
  const sortedData = useMemo(() => {
    if (!sortKey) return data
    const col = columns.find(c => c.key === sortKey)
    if (!col) return data
    const arr = [...data]
    arr.sort((a, b) => {
      const av = col.sortValue ? col.sortValue(a) : (a as any)[col.key]
      const bv = col.sortValue ? col.sortValue(b) : (b as any)[col.key]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [data, sortKey, sortDir, columns])

  const handleSort = (col: Column<T>) => {
    if (!col.sortable) return
    if (sortKey === col.key) {
      if (sortDir === 'asc') setSortDir('desc')
      else {
        setSortKey(null)
        setSortDir('asc')
      }
    } else {
      setSortKey(col.key)
      setSortDir('asc')
    }
  }

  const toggleAll = () => {
    if (selected.size === data.length) {
      setSelected(new Set())
      onSelectionChange?.([])
    } else {
      const all = new Set(data.map(r => String(r[keyField] ?? '')))
      setSelected(all)
      onSelectionChange?.(Array.from(all))
    }
  }

  const toggleRow = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
    onSelectionChange?.(Array.from(next))
  }

  const allSelected = selected.size > 0 && selected.size === data.length
  const someSelected = selected.size > 0 && selected.size < data.length

  return (
    <div
      className={cn(
        'card overflow-hidden',
        className
      )}
    >
      <div
        className="overflow-auto"
        style={maxHeight ? { maxHeight } : undefined}
      >
        <table className="min-w-full divide-y divide-border">
          <thead className={cn('bg-surface-2/40', stickyHeader && 'sticky top-0 z-10 backdrop-blur')}>
            <tr>
              {selectable && (
                <th className="w-10 px-4 py-3 sticky left-0 bg-surface-2/40">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={el => {
                      if (el) el.indeterminate = someSelected
                    }}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-border text-ink-700 focus:ring-electric-500 focus:ring-offset-0 cursor-pointer"
                  />
                </th>
              )}
              {columns.map(col => {
                const isSorted = sortKey === col.key
                const SortIcon = !col.sortable
                  ? null
                  : !isSorted
                  ? ChevronsUpDown
                  : sortDir === 'asc'
                  ? ChevronUp
                  : ChevronDown
                return (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col)}
                    className={cn(
                      'px-6 py-3 text-2xs font-semibold uppercase tracking-wider text-text-muted',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                      !col.align && 'text-left',
                      col.sortable && 'cursor-pointer select-none hover:text-text transition-colors',
                      isSorted && 'text-text'
                    )}
                    style={col.width ? { width: col.width } : undefined}
                  >
                    <div className={cn('inline-flex items-center gap-1.5',
                      col.align === 'right' && 'justify-end w-full',
                      col.align === 'center' && 'justify-center w-full'
                    )}>
                      {col.header}
                      {SortIcon && (
                        <SortIcon
                          className={cn(
                            'h-3 w-3 shrink-0 transition-colors',
                            isSorted ? 'text-text' : 'text-text-subtle'
                          )}
                          strokeWidth={2}
                        />
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-border/50">
            {loading ? (
              [...Array(loadingRows)].map((_, i) => (
                <tr key={`skl-${i}`}>
                  {selectable && (
                    <td className="px-4 py-4">
                      <Skeleton className="h-4 w-4 rounded" />
                    </td>
                  )}
                  {columns.map(col => (
                    <td key={col.key} className="px-6 py-4">
                      <Skeleton className="h-4 w-full max-w-[120px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)}>
                  {empty || (
                    <EmptyState
                      icon={Inbox}
                      title={emptyTitle}
                      description={emptyDescription}
                      compact
                    />
                  )}
                </td>
              </tr>
            ) : (
              sortedData.map(row => {
                const id = String(row[keyField] ?? '')
                const isSelected = selected.has(id)
                return (
                  <tr
                    key={id}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      'transition-colors',
                      onRowClick && 'cursor-pointer',
                      isSelected ? 'bg-electric-50/40 dark:bg-electric-900/20' : 'hover:bg-surface-2/40'
                    )}
                  >
                    {selectable && (
                      <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(id)}
                          className="h-4 w-4 rounded border-border text-ink-700 focus:ring-electric-500 focus:ring-offset-0 cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map(col => (
                      <td
                        key={col.key}
                        className={cn(
                          'px-6 py-3.5 text-sm text-text whitespace-nowrap',
                          col.align === 'right' && 'text-right',
                          col.align === 'center' && 'text-center',
                          col.className
                        )}
                      >
                        {col.render ? col.render(row) : (row as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
