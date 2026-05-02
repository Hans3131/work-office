'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Laptop, Plus, Users, MapPin, Edit, Trash2, Coffee, Wifi, Printer,
  Lock, Sparkles,
} from 'lucide-react'
import {
  PageHeader, KpiCard, StatGrid, FilterBar, Card, Badge, Spinner,
  EmptyState, Button, ActionMenu, ConfirmDialog,
} from '@/components/ui'
import { parseJsonArray } from '@/lib/json-array'
import toast from 'react-hot-toast'

interface CoworkingSpace {
  id: string
  name: string
  description: string | null
  totalSpots: number
  dailyRate: number
  monthlyRate: number
  yearlyRate: number
  amenities: string
  isActive: boolean
  center: { id: string; name: string } | null
  _count?: { subscriptions: number }
}

const AMENITY_ICONS: Record<string, any> = {
  'WiFi haut débit': Wifi,
  'Café/thé gratuit': Coffee,
  'Imprimante/scanner': Printer,
  'Casiers': Lock,
  'Terrasse': Sparkles,
  'Salle de détente': Sparkles,
  'Parking gratuit': Sparkles,
}

export default function CoworkingSpacesPage() {
  const [spaces, setSpaces] = useState<CoworkingSpace[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState<CoworkingSpace | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchSpaces = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    fetch(`/api/coworking-spaces?${params.toString()}`)
      .then(r => (r.ok ? r.json() : Promise.reject(r)))
      .then(d => setSpaces(d.spaces || d.coworkingSpaces || []))
      .catch(() => toast.error('Erreur'))
      .finally(() => setLoading(false))
  }
  useEffect(fetchSpaces, [search])

  const handleDelete = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/coworking-spaces/${confirmDelete.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error || 'Erreur')
        return
      }
      toast.success('Espace supprimé')
      setConfirmDelete(null)
      fetchSpaces()
    } catch {
      toast.error('Erreur')
    } finally {
      setDeleting(false)
    }
  }

  const totalSpots = spaces.reduce((s, sp) => s + sp.totalSpots, 0)
  const totalSubs = spaces.reduce((s, sp) => s + (sp._count?.subscriptions || 0), 0)
  const avgMonthlyRate = spaces.length === 0 ? 0 : Math.round(spaces.reduce((s, sp) => s + sp.monthlyRate, 0) / spaces.length)

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Espaces coworking"
        description="Gestion des espaces ouverts et abonnements"
        actions={
          <Link href="/dashboard/espaces-coworking/nouveau">
            <Button iconLeft={<Plus className="h-4 w-4" />}>Nouvel espace</Button>
          </Link>
        }
      />

      <StatGrid cols={4}>
        <KpiCard label="Espaces" value={spaces.length} icon={Laptop} tone="electric" loading={loading} />
        <KpiCard label="Places totales" value={totalSpots} icon={Users} tone="info" loading={loading} />
        <KpiCard label="Abonnés actifs" value={totalSubs} icon={Sparkles} tone="success" loading={loading} />
        <KpiCard label="Tarif moyen" value={`${avgMonthlyRate} €/m`} icon={Plus} tone="gold" loading={loading} />
      </StatGrid>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher un espace..."
      />

      {loading ? (
        <Card className="p-12 text-center"><Spinner size="lg" /></Card>
      ) : spaces.length === 0 ? (
        <Card className="p-2">
          <EmptyState
            icon={Laptop}
            title="Aucun espace coworking"
            description="Crée ton premier espace pour proposer des abonnements à tes clients."
            action={
              <Link href="/dashboard/espaces-coworking/nouveau">
                <Button iconLeft={<Plus className="h-4 w-4" />}>Créer un espace</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {spaces.map(s => {
            const amenities = parseJsonArray(s.amenities)
            return (
              <Card key={s.id} variant="default" className="overflow-hidden group hover:shadow-soft-md transition-all duration-300">
                <div className="relative h-32 bg-gradient-to-br from-electric-500 via-electric-700 to-ink-800 overflow-hidden">
                  <div className="absolute inset-0 opacity-25" style={{
                    backgroundImage: 'radial-gradient(circle at 70% 30%, rgba(201,162,39,0.5) 0, transparent 50%)',
                  }} />
                  <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                    <Badge tone="gold" size="sm" className="!bg-white/15 !text-white !ring-white/20 backdrop-blur">
                      {s.totalSpots} places
                    </Badge>
                    <ActionMenu
                      align="right"
                      trigger={
                        <div className="h-8 w-8 rounded-md bg-white/10 backdrop-blur ring-1 ring-white/20 inline-flex items-center justify-center text-white">
                          <Edit className="h-3.5 w-3.5" />
                        </div>
                      }
                      items={[
                        { label: 'Modifier', icon: Edit, href: `/dashboard/espaces-coworking/${s.id}` },
                        'divider',
                        { label: 'Supprimer', icon: Trash2, danger: true, onClick: () => setConfirmDelete(s) },
                      ]}
                    />
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <h3 className="text-lg font-semibold tracking-tight text-white">{s.name}</h3>
                    {s.center && (
                      <p className="text-2xs text-white/70 inline-flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        {s.center.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {s.description && (
                    <p className="text-xs text-text-muted line-clamp-2">{s.description}</p>
                  )}

                  {/* Tarifs */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-border">
                    <div className="text-center">
                      <p className="text-2xs text-text-subtle uppercase tracking-wider">Jour</p>
                      <p className="text-sm font-semibold text-text nums-tabular">{s.dailyRate}€</p>
                    </div>
                    <div className="text-center border-x border-border">
                      <p className="text-2xs text-text-subtle uppercase tracking-wider">Mois</p>
                      <p className="text-sm font-semibold text-text nums-tabular">{s.monthlyRate}€</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xs text-text-subtle uppercase tracking-wider">An</p>
                      <p className="text-sm font-semibold text-text nums-tabular">{s.yearlyRate}€</p>
                    </div>
                  </div>

                  {/* Amenities */}
                  {amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {amenities.slice(0, 4).map((a: string) => {
                        const Icon = AMENITY_ICONS[a] || Sparkles
                        return (
                          <span
                            key={a}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-2xs font-medium rounded-md bg-surface-2 text-text-muted ring-1 ring-inset ring-border"
                          >
                            <Icon className="h-2.5 w-2.5" />
                            {a}
                          </span>
                        )
                      })}
                      {amenities.length > 4 && (
                        <span className="text-2xs text-text-subtle px-2 py-0.5">+{amenities.length - 4}</span>
                      )}
                    </div>
                  )}

                  {s._count?.subscriptions !== undefined && (
                    <div className="flex items-center justify-between text-xs text-text-muted pt-2">
                      <span>Abonnés actifs</span>
                      <Badge tone="success" size="sm">{s._count.subscriptions}</Badge>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title={`Supprimer "${confirmDelete?.name}" ?`}
        description="Tous les abonnements liés seront affectés."
        confirmLabel="Supprimer"
        tone="danger"
        loading={deleting}
      />
    </div>
  )
}
