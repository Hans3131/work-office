'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Laptop,
  Plus,
  Search,
  Users,
  MapPin,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Calendar,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { parseJsonArray } from '@/lib/json-array'

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
  createdAt: string
  center: { id: string; name: string } | null
  _count: { subscriptions: number }
}

export default function CoworkingSpacesPage() {
  const [spaces, setSpaces] = useState<CoworkingSpace[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchSpaces = () => {
    const params = new URLSearchParams()
    if (searchTerm) params.set('search', searchTerm)

    setLoading(true)
    fetch(`/api/coworking-spaces?${params.toString()}`)
      .then(r => (r.ok ? r.json() : Promise.reject(r)))
      .then(data => {
        setSpaces(data.spaces || [])
        setError(null)
      })
      .catch(() => setError('Erreur lors du chargement des espaces'))
      .finally(() => setLoading(false))
  }

  useEffect(fetchSpaces, [searchTerm])

  const handleDelete = async (s: CoworkingSpace) => {
    if (!confirm(`Supprimer l’espace "${s.name}" ?`)) return
    setDeletingId(s.id)
    try {
      const res = await fetch(`/api/coworking-spaces/${s.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Suppression impossible')
        return
      }
      toast.success(`Espace "${s.name}" supprimé`)
      fetchSpaces()
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setDeletingId(null)
    }
  }

  const totalSpots = spaces.reduce((s, sp) => s + sp.totalSpots, 0)
  const activeSpaces = spaces.filter(s => s.isActive).length
  const totalSubs = spaces.reduce((s, sp) => s + sp._count.subscriptions, 0)

  const stats = [
    { title: 'Espaces', value: spaces.length, icon: Laptop, color: 'blue' },
    { title: 'Actifs', value: activeSpaces, icon: Laptop, color: 'green' },
    { title: 'Postes totaux', value: totalSpots, icon: Users, color: 'purple' },
    { title: 'Abonnements', value: totalSubs, icon: Calendar, color: 'orange' },
  ]

  const StatCard = ({ title, value, icon: Icon, color }: any) => {
    const cls: Record<string, string> = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
    }
    return (
      <div className="stat-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value.toLocaleString('fr-FR')}</p>
          </div>
          <div className={`p-3 rounded-full ${cls[color]}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Espaces de coworking</h1>
          <p className="text-gray-600">Gérez vos espaces ouverts et leurs abonnements</p>
        </div>
        <Link href="/dashboard/espaces-coworking/nouveau" className="btn-primary">
          <Plus className="h-5 w-5" />
          Nouvel espace
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      <div className="card">
        <div className="p-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un espace..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 form-input"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : error ? (
        <div className="card p-6 bg-red-50 text-red-700">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {spaces.length === 0 && (
            <div className="col-span-full card p-12 text-center text-gray-500">
              Aucun espace trouvé.
            </div>
          )}
          {spaces.map(space => {
            const amenities = parseJsonArray(space.amenities)
            return (
              <div key={space.id} className="card hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Laptop className="h-5 w-5 text-primary-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{space.name}</h3>
                      </div>
                      {space.description && (
                        <p className="text-sm text-gray-500 mt-2">{space.description}</p>
                      )}
                    </div>
                    <span className={`status-badge ${space.isActive ? 'status-active' : 'bg-gray-100 text-gray-700'}`}>
                      {space.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-gray-400" />
                      Capacité : <span className="ml-1 font-medium text-gray-900">{space.totalSpots} postes</span>
                    </div>
                    {space.center && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        {space.center.name}
                      </div>
                    )}
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {space._count.subscriptions} abonnement(s) actif(s)
                    </div>
                  </div>

                  {amenities.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-500 mb-2">Équipements</p>
                      <div className="flex flex-wrap gap-1">
                        {amenities.map((a, i) => (
                          <span key={i} className="px-2 py-1 text-xs bg-gray-100 rounded">{a}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-gray-500">Jour</p>
                      <p className="text-sm font-bold text-gray-900">{space.dailyRate.toFixed(0)} €</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Mois</p>
                      <p className="text-sm font-bold text-primary-600">{space.monthlyRate.toFixed(0)} €</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Année</p>
                      <p className="text-sm font-bold text-gray-900">{space.yearlyRate.toFixed(0)} €</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end gap-2">
                    <Link
                      href={`/dashboard/espaces-coworking/${space.id}`}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(space)}
                      disabled={deletingId === space.id}
                      className="p-2 text-red-400 hover:text-red-600 rounded hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingId === space.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
