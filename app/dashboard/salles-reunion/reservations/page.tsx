'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Plus,
  Search,
  Loader2,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Reservation {
  id: string
  title: string
  description: string | null
  startTime: string
  endTime: string
  totalAmount: number
  status: string
  user: { id: string; name: string | null; email: string }
  meetingRoom: { id: string; name: string }
}

const statusLabel = (s: string) =>
  ({ CONFIRMED: 'Confirmée', PENDING: 'En attente', CANCELLED: 'Annulée' }[s] || s)
const statusColor = (s: string) =>
  ({
    CONFIRMED: 'bg-green-100 text-green-800',
    PENDING: 'bg-blue-100 text-blue-800',
    CANCELLED: 'bg-red-100 text-red-800',
  }[s] || 'bg-gray-100 text-gray-700')

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [upcomingOnly, setUpcomingOnly] = useState(false)
  const [actingId, setActingId] = useState<string | null>(null)

  const fetchReservations = () => {
    const params = new URLSearchParams()
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (upcomingOnly) params.set('upcoming', 'true')

    setLoading(true)
    fetch(`/api/reservations?${params.toString()}`)
      .then(r => (r.ok ? r.json() : Promise.reject(r)))
      .then(d => {
        setReservations(d.reservations || [])
        setError(null)
      })
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }

  useEffect(fetchReservations, [statusFilter, upcomingOnly])

  const cancel = async (r: Reservation) => {
    if (!confirm(`Annuler la réservation "${r.title}" ?`)) return
    setActingId(r.id)
    try {
      const res = await fetch(`/api/reservations/${r.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error || 'Erreur')
        return
      }
      toast.success('Réservation annulée')
      fetchReservations()
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setActingId(null)
    }
  }

  const handleDelete = async (r: Reservation) => {
    if (!confirm(`Supprimer définitivement cette réservation ?`)) return
    setActingId(r.id)
    try {
      const res = await fetch(`/api/reservations/${r.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error || 'Erreur')
        return
      }
      toast.success('Réservation supprimée')
      fetchReservations()
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setActingId(null)
    }
  }

  const filtered = reservations.filter(
    r =>
      !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.meetingRoom.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.user.name?.toLowerCase().includes(search.toLowerCase()) ?? false)
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Réservations</h1>
          <p className="text-gray-600">Toutes les réservations de salles de réunion</p>
        </div>
        <Link href="/dashboard/salles-reunion/reservations/ajouter" className="btn-primary">
          <Plus className="h-5 w-5" />
          Nouvelle réservation
        </Link>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher (titre, salle, utilisateur)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 form-input"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="form-input">
          <option value="all">Tous les statuts</option>
          <option value="confirmed">Confirmées</option>
          <option value="pending">En attente</option>
          <option value="cancelled">Annulées</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={upcomingOnly}
            onChange={e => setUpcomingOnly(e.target.checked)}
            className="h-4 w-4"
          />
          À venir uniquement
        </label>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 text-red-700">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">Aucune réservation trouvée.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="table-header">Titre</th>
                  <th className="table-header">Salle</th>
                  <th className="table-header">Réservé par</th>
                  <th className="table-header">Date/heure</th>
                  <th className="table-header">Durée</th>
                  <th className="table-header">Total</th>
                  <th className="table-header">Statut</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map(r => {
                  const start = new Date(r.startTime)
                  const end = new Date(r.endTime)
                  const durationH = Math.round(((end.getTime() - start.getTime()) / 3600000) * 10) / 10
                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="table-cell font-medium">{r.title}</td>
                      <td className="table-cell">{r.meetingRoom.name}</td>
                      <td className="table-cell">
                        <div className="text-sm">{r.user.name || r.user.email}</div>
                      </td>
                      <td className="table-cell text-sm">
                        <div>{start.toLocaleDateString('fr-FR')}</div>
                        <div className="text-gray-500 text-xs">
                          {start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} →{' '}
                          {end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="table-cell text-sm">{durationH} h</td>
                      <td className="table-cell font-semibold">{r.totalAmount.toFixed(2)} €</td>
                      <td className="table-cell">
                        <span className={`status-badge ${statusColor(r.status)}`}>
                          {statusLabel(r.status)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex gap-1">
                          {r.status !== 'CANCELLED' && (
                            <button
                              onClick={() => cancel(r)}
                              disabled={actingId === r.id}
                              className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                            >
                              {actingId === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Annuler'}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(r)}
                            disabled={actingId === r.id}
                            className="p-1 text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-6 py-3 border-t border-gray-200 text-sm text-gray-700">
          {filtered.length} réservation(s)
        </div>
      </div>
    </div>
  )
}
