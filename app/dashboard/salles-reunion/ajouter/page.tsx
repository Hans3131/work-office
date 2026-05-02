'use client'

import { useEffect, useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save, Plus, X, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

const COMMON_EQUIPMENT = ['WiFi', 'Écran TV', 'Projecteur', 'Whiteboard', 'Webcam HD', 'Système audio', 'Visio-conférence']

export default function AddMeetingRoomPage() {
  const router = useRouter()
  const [centers, setCenters] = useState<{ id: string; name: string }[]>([])
  const [submitting, setSubmitting] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [capacity, setCapacity] = useState(8)
  const [hourlyRate, setHourlyRate] = useState(20)
  const [centerId, setCenterId] = useState('')
  const [equipment, setEquipment] = useState<string[]>(['WiFi'])
  const [newEquip, setNewEquip] = useState('')

  useEffect(() => {
    fetch('/api/centers')
      .then(r => (r.ok ? r.json() : Promise.reject(r)))
      .then(d => {
        const cs = d.centers || []
        setCenters(cs)
        if (cs.length) setCenterId(cs[0].id)
      })
      .catch(() => toast.error('Impossible de charger les centres'))
  }, [])

  const toggleEquip = (e: string) => {
    setEquipment(prev => (prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]))
  }

  const addCustomEquip = () => {
    if (!newEquip.trim()) return
    if (equipment.includes(newEquip.trim())) return
    setEquipment([...equipment, newEquip.trim()])
    setNewEquip('')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/meeting-rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || undefined,
          capacity: Number(capacity),
          equipment: JSON.stringify(equipment),
          hourlyRate: Number(hourlyRate),
          centerId,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error || 'Erreur')
        return
      }
      toast.success('Salle créée')
      router.push('/dashboard/salles-reunion')
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
        <Link href="/dashboard/salles-reunion" className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-7 w-7 text-primary-600" />
            Ajouter une salle de réunion
          </h1>
          <p className="text-gray-600">Créer une nouvelle salle disponible à la réservation</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="form-label">Nom de la salle <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Ex: Créative, Efficace..."
              className="form-input"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="form-label">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="Description courte de la salle..."
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Capacité (personnes) <span className="text-red-500">*</span></label>
            <input
              type="number"
              min={1}
              value={capacity}
              onChange={e => setCapacity(Number(e.target.value))}
              required
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Tarif horaire (€) <span className="text-red-500">*</span></label>
            <input
              type="number"
              step="0.5"
              min={0}
              value={hourlyRate}
              onChange={e => setHourlyRate(Number(e.target.value))}
              required
              className="form-input"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="form-label">Centre <span className="text-red-500">*</span></label>
            <select
              value={centerId}
              onChange={e => setCenterId(e.target.value)}
              required
              className="form-input"
            >
              <option value="">Sélectionner un centre</option>
              {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Équipements</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {COMMON_EQUIPMENT.map(e => (
              <button
                key={e}
                type="button"
                onClick={() => toggleEquip(e)}
                className={`px-3 py-1 text-sm rounded-full border transition ${
                  equipment.includes(e)
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-primary-500'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newEquip}
              onChange={e => setNewEquip(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomEquip())}
              placeholder="Ajouter un équipement personnalisé..."
              className="form-input flex-1"
            />
            <button type="button" onClick={addCustomEquip} className="btn-secondary">
              <Plus className="h-4 w-4" />
              Ajouter
            </button>
          </div>
          {equipment.length > 0 && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-2">Sélectionnés ({equipment.length}) :</p>
              <div className="flex flex-wrap gap-2">
                {equipment.map(e => (
                  <span key={e} className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded">
                    {e}
                    <button type="button" onClick={() => toggleEquip(e)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Link href="/dashboard/salles-reunion" className="btn-secondary">Annuler</Link>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Créer la salle
          </button>
        </div>
      </form>
    </div>
  )
}
