'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  CalendarDays, Plus, Users, MapPin, Edit, Trash2, Eye, Wifi, Tv, Mic,
  Video, Sparkles, Clock, BarChart3, Settings,
} from 'lucide-react'
import {
  PageHeader, KpiCard, StatGrid, FilterBar, Card, Badge, Spinner,
  EmptyState, Button, ActionMenu, ConfirmDialog,
} from '@/components/ui'
import { parseJsonArray } from '@/lib/json-array'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface MeetingRoom {
  id: string
  name: string
  description: string | null
  capacity: number
  equipment: string
  hourlyRate: number
  isActive: boolean
  center: { id: string; name: string } | null
  _count?: { reservations: number }
}

// Mappage equipment -> icone (visuel premium)
const EQUIP_ICONS: Record<string, any> = {
  'WiFi': Wifi,
  'Écran TV': Tv,
  'Projecteur': Tv,
  'Whiteboard': Edit,
  'Webcam HD': Video,
  'Système audio': Mic,
  'Système de visioconférence': Video,
  'Visio-conférence': Video,
}

export default function MeetingRoomsPage() {
  const [rooms, setRooms] = useState<MeetingRoom[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState<MeetingRoom | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchRooms = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    setLoading(true)
    fetch(`/api/meeting-rooms?${params.toString()}`)
      .then(r => (r.ok ? r.json() : Promise.reject(r)))
      .then(d => setRooms(d.rooms || d.meetingRooms || []))
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false))
  }

  useEffect(fetchRooms, [search])

  const handleDelete = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/meeting-rooms/${confirmDelete.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success(`${confirmDelete.name} supprimée`)
      setConfirmDelete(null)
      fetchRooms()
    } catch {
      toast.error('Erreur')
    } finally {
      setDeleting(false)
    }
  }

  const totalRooms = rooms.length
  const totalCapacity = rooms.reduce((s, r) => s + r.capacity, 0)
  const avgRate = rooms.length === 0 ? 0 : Math.round(rooms.reduce((s, r) => s + r.hourlyRate, 0) / rooms.length)
  const totalReservations = rooms.reduce((s, r) => s + (r._count?.reservations || 0), 0)

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Salles de réunion"
        description="Catalogue des salles disponibles à la réservation"
        actions={
          <>
            <Link href="/dashboard/salles-reunion/reservations">
              <Button variant="secondary" iconLeft={<CalendarDays className="h-4 w-4" />}>
                Réservations
              </Button>
            </Link>
            <Link href="/dashboard/salles-reunion/statistiques">
              <Button variant="secondary" iconLeft={<BarChart3 className="h-4 w-4" />}>
                Statistiques
              </Button>
            </Link>
            <Link href="/dashboard/salles-reunion/ajouter">
              <Button iconLeft={<Plus className="h-4 w-4" />}>Ajouter une salle</Button>
            </Link>
          </>
        }
      />

      <StatGrid cols={4}>
        <KpiCard label="Salles" value={totalRooms} icon={CalendarDays} tone="electric" loading={loading} />
        <KpiCard label="Capacité totale" value={`${totalCapacity} pers.`} icon={Users} tone="info" loading={loading} />
        <KpiCard label="Tarif moyen" value={`${avgRate} €/h`} icon={Clock} tone="gold" loading={loading} />
        <KpiCard label="Réservations" value={totalReservations} icon={Sparkles} tone="success" loading={loading} />
      </StatGrid>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher une salle..."
      />

      {loading ? (
        <Card className="p-12 text-center"><Spinner size="lg" /></Card>
      ) : rooms.length === 0 ? (
        <Card className="p-2">
          <EmptyState
            icon={CalendarDays}
            title="Aucune salle"
            description="Crée ta première salle de réunion pour commencer à gérer les réservations."
            action={
              <Link href="/dashboard/salles-reunion/ajouter">
                <Button iconLeft={<Plus className="h-4 w-4" />}>Ajouter une salle</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {rooms.map(room => {
            const equipment = parseJsonArray(room.equipment)
            return (
              <Card key={room.id} variant="default" className="overflow-hidden group hover:shadow-soft-md transition-all duration-300">
                {/* Image placeholder premium avec gradient */}
                <div className="relative h-32 bg-gradient-to-br from-ink-700 via-ink-800 to-ink-900 overflow-hidden">
                  <div className="absolute inset-0 opacity-30" style={{
                    backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(59,130,246,0.6) 0, transparent 50%), radial-gradient(circle at 70% 80%, rgba(201,162,39,0.4) 0, transparent 50%)',
                  }} />
                  <div className="absolute inset-0 opacity-[0.04]" style={{
                    backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                  }} />
                  <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                    <Badge tone="gold" size="sm" className="!bg-white/15 !text-white !ring-white/20 backdrop-blur">
                      {room.hourlyRate} €/h
                    </Badge>
                    <ActionMenu
                      align="right"
                      trigger={
                        <div className="h-8 w-8 rounded-md bg-white/10 backdrop-blur ring-1 ring-white/20 inline-flex items-center justify-center text-white">
                          <Settings className="h-3.5 w-3.5" />
                        </div>
                      }
                      items={[
                        { label: 'Voir détails', icon: Eye },
                        { label: 'Modifier', icon: Edit },
                        'divider',
                        { label: 'Supprimer', icon: Trash2, danger: true, onClick: () => setConfirmDelete(room) },
                      ]}
                    />
                  </div>
                  <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 text-2xs text-white/80">
                    <Users className="h-3 w-3" />
                    {room.capacity} personnes max
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0">
                      <h3 className="text-md font-semibold tracking-tight text-text truncate">
                        {room.name}
                      </h3>
                      {room.center && (
                        <p className="text-xs text-text-muted inline-flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-text-subtle" />
                          {room.center.name}
                        </p>
                      )}
                    </div>
                    {room._count?.reservations !== undefined && (
                      <Badge tone="neutral" size="sm">
                        {room._count.reservations} rés.
                      </Badge>
                    )}
                  </div>

                  {room.description && (
                    <p className="text-xs text-text-muted line-clamp-2 mb-3">
                      {room.description}
                    </p>
                  )}

                  {/* Equipments chips */}
                  {equipment.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-border">
                      {equipment.slice(0, 4).map((e: string) => {
                        const Icon = EQUIP_ICONS[e] || Sparkles
                        return (
                          <span
                            key={e}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-2xs font-medium rounded-md bg-surface-2 text-text-muted ring-1 ring-inset ring-border"
                          >
                            <Icon className="h-2.5 w-2.5" />
                            {e}
                          </span>
                        )
                      })}
                      {equipment.length > 4 && (
                        <span className="text-2xs text-text-subtle px-2 py-0.5">
                          +{equipment.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="px-5 pb-4 flex gap-2">
                  <Link href={`/dashboard/salles-reunion/reservations/ajouter?roomId=${room.id}`} className="flex-1">
                    <Button variant="primary" size="sm" fullWidth iconLeft={<CalendarDays className="h-3.5 w-3.5" />}>
                      Réserver
                    </Button>
                  </Link>
                  <Button variant="secondary" size="sm" iconLeft={<Eye className="h-3.5 w-3.5" />}>
                    Détails
                  </Button>
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
        description="Toutes les réservations associées seront également supprimées."
        confirmLabel="Supprimer"
        tone="danger"
        loading={deleting}
      />
    </div>
  )
}
