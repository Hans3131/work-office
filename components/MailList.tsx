'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Mail,
  Plus,
  Search,
  CheckCircle,
  Clock,
  RotateCcw,
  Trash2,
  Loader2,
  Inbox,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface MailItem {
  id: string
  recipient: string
  sender: string | null
  status: string
  receivedAt: string
  collectedAt: string | null
  notes: string | null
  enterprise: { id: string; name: string } | null
  center: { id: string; name: string } | null
}

const statusLabel = (s: string) =>
  ({ RECEIVED: 'Reçu', COLLECTED: 'Récupéré', RETURNED: 'Retourné' }[s] || s)
const statusColor = (s: string) =>
  ({
    RECEIVED: 'bg-blue-100 text-blue-800',
    COLLECTED: 'bg-green-100 text-green-800',
    RETURNED: 'bg-orange-100 text-orange-800',
  }[s] || 'bg-gray-100 text-gray-800')

interface Props {
  /**
   * Filtre initial sur le statut (utile pour la page "Courriers à enlever").
   */
  forcedStatus?: 'received' | 'collected' | 'returned'
  title?: string
  description?: string
}

export default function MailList({ forcedStatus, title, description }: Props) {
  const [mails, setMails] = useState<MailItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>(forcedStatus || 'all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchMails = () => {
    const params = new URLSearchParams()
    if (searchTerm) params.set('search', searchTerm)
    const effectiveStatus = forcedStatus || statusFilter
    if (effectiveStatus !== 'all') params.set('status', effectiveStatus)

    setLoading(true)
    fetch(`/api/mails?${params.toString()}`)
      .then(r => (r.ok ? r.json() : Promise.reject(r)))
      .then(data => {
        setMails(data.mails || [])
        setError(null)
      })
      .catch(() => setError('Erreur lors du chargement des courriers'))
      .finally(() => setLoading(false))
  }

  useEffect(fetchMails, [searchTerm, statusFilter, forcedStatus])

  const markCollected = async (m: MailItem) => {
    setUpdatingId(m.id)
    try {
      const res = await fetch(`/api/mails/${m.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COLLECTED' }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error || 'Erreur')
        return
      }
      toast.success(`Courrier de ${m.recipient} marqué récupéré`)
      fetchMails()
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (m: MailItem) => {
    if (!confirm(`Supprimer le courrier de ${m.recipient} ?`)) return
    setUpdatingId(m.id)
    try {
      const res = await fetch(`/api/mails/${m.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error || 'Erreur')
        return
      }
      toast.success('Courrier supprimé')
      fetchMails()
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setUpdatingId(null)
    }
  }

  const stats = [
    { title: 'Total', value: mails.length, icon: Mail, color: 'blue' },
    { title: 'Reçus', value: mails.filter(m => m.status === 'RECEIVED').length, icon: Inbox, color: 'orange' },
    { title: 'Récupérés', value: mails.filter(m => m.status === 'COLLECTED').length, icon: CheckCircle, color: 'green' },
    { title: 'Retournés', value: mails.filter(m => m.status === 'RETURNED').length, icon: RotateCcw, color: 'purple' },
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
          <h1 className="text-2xl font-bold text-gray-900">{title || 'Courriers'}</h1>
          <p className="text-gray-600">{description || 'Gestion du courrier reçu pour les entreprises domiciliées'}</p>
        </div>
        <Link href="/dashboard/courriers/nouveau" className="btn-primary">
          <Plus className="h-5 w-5" />
          Enregistrer un courrier
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      <div className="card">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher (destinataire, expéditeur)..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 form-input"
                />
              </div>
            </div>
            {!forcedStatus && (
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="form-input">
                <option value="all">Tous les statuts</option>
                <option value="received">Reçus</option>
                <option value="collected">Récupérés</option>
                <option value="returned">Retournés</option>
              </select>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 text-red-700">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="table-header">Destinataire</th>
                  <th className="table-header">Expéditeur</th>
                  <th className="table-header">Entreprise</th>
                  <th className="table-header">Reçu le</th>
                  <th className="table-header">Récupéré le</th>
                  <th className="table-header">Statut</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mails.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-500">Aucun courrier trouvé.</td></tr>
                )}
                {mails.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{m.recipient}</td>
                    <td className="table-cell text-gray-600">{m.sender || '—'}</td>
                    <td className="table-cell">{m.enterprise?.name || '—'}</td>
                    <td className="table-cell">{new Date(m.receivedAt).toLocaleDateString('fr-FR')}</td>
                    <td className="table-cell text-gray-600">
                      {m.collectedAt ? new Date(m.collectedAt).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="table-cell">
                      <span className={`status-badge ${statusColor(m.status)}`}>{statusLabel(m.status)}</span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        {m.status !== 'COLLECTED' && (
                          <button
                            onClick={() => markCollected(m)}
                            disabled={updatingId === m.id}
                            className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                          >
                            {updatingId === m.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              'Marquer récupéré'
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(m)}
                          disabled={updatingId === m.id}
                          className="p-1 text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
