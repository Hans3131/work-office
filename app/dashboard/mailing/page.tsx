'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Send,
  Plus,
  Search,
  Mail,
  Eye,
  MousePointer,
  Calendar,
  Loader2,
  Users,
  Edit,
  Trash2,
  Play,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Campaign {
  id: string
  name: string
  subject: string
  status: string
  scheduledAt: string | null
  sentAt: string | null
  createdAt: string
  _count: { recipients: number }
  sentCount: number
  openedCount: number
  clickedCount: number
}

const statusLabel = (s: string) =>
  ({ DRAFT: 'Brouillon', SCHEDULED: 'Programmée', SENT: 'Envoyée', CANCELLED: 'Annulée' }[s] || s)
const statusColor = (s: string) =>
  ({
    DRAFT: 'bg-gray-100 text-gray-700',
    SCHEDULED: 'bg-blue-100 text-blue-800',
    SENT: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  }[s] || 'bg-gray-100 text-gray-700')

const pct = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 100))

export default function MailingPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [actingId, setActingId] = useState<string | null>(null)

  const fetchCampaigns = () => {
    setLoading(true)
    fetch('/api/mailing')
      .then(r => (r.ok ? r.json() : Promise.reject(r)))
      .then(d => {
        setCampaigns(d.campaigns || [])
        setError(null)
      })
      .catch(() => setError('Erreur lors du chargement des campagnes'))
      .finally(() => setLoading(false))
  }

  useEffect(fetchCampaigns, [])

  const sendNow = async (c: Campaign) => {
    if (!confirm(`Envoyer la campagne "${c.name}" maintenant ?`)) return
    setActingId(c.id)
    try {
      const res = await fetch(`/api/mailing/${c.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SENT' }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error || 'Erreur')
        return
      }
      toast.success(`Campagne "${c.name}" envoyée`)
      fetchCampaigns()
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setActingId(null)
    }
  }

  const handleDelete = async (c: Campaign) => {
    if (!confirm(`Supprimer la campagne "${c.name}" ?`)) return
    setActingId(c.id)
    try {
      const res = await fetch(`/api/mailing/${c.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error || 'Erreur')
        return
      }
      toast.success('Campagne supprimée')
      fetchCampaigns()
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setActingId(null)
    }
  }

  const filtered = campaigns.filter(
    c =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.subject.toLowerCase().includes(search.toLowerCase())
  )

  const totalSent = campaigns.reduce((s, c) => s + c.sentCount, 0)
  const totalOpened = campaigns.reduce((s, c) => s + c.openedCount, 0)
  const totalClicked = campaigns.reduce((s, c) => s + c.clickedCount, 0)
  const totalRecipients = campaigns.reduce((s, c) => s + c._count.recipients, 0)

  const stats = [
    { title: 'Campagnes', value: campaigns.length, icon: Send, color: 'blue' },
    { title: 'Destinataires', value: totalRecipients, icon: Users, color: 'purple' },
    { title: 'Taux ouverture', value: `${pct(totalOpened, totalSent)} %`, icon: Eye, color: 'green' },
    { title: 'Taux clic', value: `${pct(totalClicked, totalSent)} %`, icon: MousePointer, color: 'orange' },
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
            <p className="text-2xl font-bold text-gray-900">
              {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
            </p>
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
          <h1 className="text-2xl font-bold text-gray-900">Mailing</h1>
          <p className="text-gray-600">Créez et suivez vos campagnes email</p>
        </div>
        <Link href="/dashboard/mailing/nouveau" className="btn-primary">
          <Plus className="h-5 w-5" />
          Nouvelle campagne
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      <div className="card p-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher (nom, sujet)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 form-input"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : error ? (
        <div className="card p-6 bg-red-50 text-red-700">{error}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filtered.length === 0 && (
            <div className="col-span-full card p-12 text-center text-gray-500">
              Aucune campagne trouvée.
            </div>
          )}
          {filtered.map(c => (
            <div key={c.id} className="card hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="h-5 w-5 text-primary-600" />
                      <h3 className="text-lg font-semibold text-gray-900">{c.name}</h3>
                    </div>
                    <p className="text-sm text-gray-500 ml-7 italic">"{c.subject}"</p>
                  </div>
                  <span className={`status-badge ${statusColor(c.status)}`}>
                    {statusLabel(c.status)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-4 border-t border-gray-100 mb-4">
                  <div>
                    <Users className="h-4 w-4 mx-auto text-gray-400 mb-1" />
                    <p className="text-sm font-bold text-gray-900">{c._count.recipients}</p>
                    <p className="text-xs text-gray-500">Destinataires</p>
                  </div>
                  <div>
                    <Eye className="h-4 w-4 mx-auto text-green-500 mb-1" />
                    <p className="text-sm font-bold text-gray-900">
                      {pct(c.openedCount, c.sentCount)} %
                    </p>
                    <p className="text-xs text-gray-500">{c.openedCount} ouvertures</p>
                  </div>
                  <div>
                    <MousePointer className="h-4 w-4 mx-auto text-orange-500 mb-1" />
                    <p className="text-sm font-bold text-gray-900">
                      {pct(c.clickedCount, c.sentCount)} %
                    </p>
                    <p className="text-xs text-gray-500">{c.clickedCount} clics</p>
                  </div>
                </div>

                <div className="text-xs text-gray-500 flex items-center gap-1 mb-4">
                  <Calendar className="h-3 w-3" />
                  {c.sentAt
                    ? `Envoyée le ${new Date(c.sentAt).toLocaleDateString('fr-FR')}`
                    : c.scheduledAt
                    ? `Programmée pour le ${new Date(c.scheduledAt).toLocaleDateString('fr-FR')}`
                    : `Créée le ${new Date(c.createdAt).toLocaleDateString('fr-FR')}`}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                  <Link
                    href={`/dashboard/mailing/${c.id}`}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  {c.status === 'DRAFT' && (
                    <>
                      <button
                        onClick={() => sendNow(c)}
                        disabled={actingId === c.id}
                        className="px-3 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 inline-flex items-center gap-1"
                      >
                        {actingId === c.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                        Envoyer
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(c)}
                    disabled={actingId === c.id}
                    className="p-2 text-red-400 hover:text-red-600 rounded hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
