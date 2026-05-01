'use client'

import { useEffect, useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import toast from 'react-hot-toast'

export default function NewMailPage() {
  const router = useRouter()
  const [centers, setCenters] = useState<{ id: string; name: string }[]>([])
  const [enterprises, setEnterprises] = useState<{ id: string; name: string }[]>([])
  const [submitting, setSubmitting] = useState(false)

  const [recipient, setRecipient] = useState('')
  const [sender, setSender] = useState('')
  const [centerId, setCenterId] = useState('')
  const [enterpriseId, setEnterpriseId] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/centers').then(r => (r.ok ? r.json() : Promise.reject(r))),
      fetch('/api/enterprises?limit=200').then(r => (r.ok ? r.json() : Promise.reject(r))),
    ])
      .then(([c, e]) => {
        const cs = (c.centers || []).map((x: any) => ({ id: x.id, name: x.name }))
        const es = (e.enterprises || []).map((x: any) => ({ id: x.id, name: x.name }))
        setCenters(cs)
        setEnterprises(es)
        if (cs.length && !centerId) setCenterId(cs[0].id)
      })
      .catch(() => toast.error('Impossible de charger les données'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/mails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient,
          sender: sender || undefined,
          centerId,
          enterpriseId: enterpriseId || undefined,
          notes: notes || undefined,
          status: 'RECEIVED',
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error || 'Erreur lors de l’enregistrement')
        return
      }
      toast.success('Courrier enregistré')
      router.push('/dashboard/courriers')
      router.refresh()
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/courriers" className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enregistrer un courrier</h1>
          <p className="text-gray-600">Réception d’un nouveau courrier pour une entreprise domiciliée</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="form-label">Destinataire <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
                required
                placeholder="Nom et prénom du destinataire"
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Expéditeur</label>
              <input
                type="text"
                value={sender}
                onChange={e => setSender(e.target.value)}
                placeholder="Ex: La Poste, BNP Paribas..."
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Centre <span className="text-red-500">*</span></label>
              <select
                value={centerId}
                onChange={e => setCenterId(e.target.value)}
                required
                className="form-input"
              >
                <option value="">Sélectionner un centre</option>
                {centers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Entreprise concernée</label>
              <select
                value={enterpriseId}
                onChange={e => setEnterpriseId(e.target.value)}
                className="form-input"
              >
                <option value="">— Aucune (courrier personnel) —</option>
                {enterprises.map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Recommandé, urgent, lettre simple..."
                className="form-input"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Link href="/dashboard/courriers" className="btn-secondary">Annuler</Link>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  )
}
