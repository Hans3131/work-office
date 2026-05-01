'use client'

import { useEffect, useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'

export interface CoworkingFormData {
  name: string
  description: string
  totalSpots: number
  dailyRate: number
  monthlyRate: number
  yearlyRate: number
  amenities: string[]
  isActive: boolean
  centerId: string
}

interface Props {
  initialData?: Partial<CoworkingFormData>
  spaceId?: string
}

const empty: CoworkingFormData = {
  name: '',
  description: '',
  totalSpots: 10,
  dailyRate: 25,
  monthlyRate: 300,
  yearlyRate: 3000,
  amenities: [],
  isActive: true,
  centerId: '',
}

export default function CoworkingForm({ initialData, spaceId }: Props) {
  const router = useRouter()
  const [data, setData] = useState<CoworkingFormData>({ ...empty, ...initialData })
  const [centers, setCenters] = useState<{ id: string; name: string }[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [newAmenity, setNewAmenity] = useState('')

  const isEdit = !!spaceId

  useEffect(() => {
    fetch('/api/centers')
      .then(r => (r.ok ? r.json() : Promise.reject(r)))
      .then(d => {
        const list = (d.centers || []).map((c: any) => ({ id: c.id, name: c.name }))
        setCenters(list)
        if (!isEdit && list.length && !data.centerId) {
          setData(prev => ({ ...prev, centerId: list[0].id }))
        }
      })
      .catch(() => toast.error('Impossible de charger les centres'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const update = <K extends keyof CoworkingFormData>(key: K, value: CoworkingFormData[K]) =>
    setData(d => ({ ...d, [key]: value }))

  const addAmenity = () => {
    const v = newAmenity.trim()
    if (!v) return
    if (data.amenities.includes(v)) return
    update('amenities', [...data.amenities, v])
    setNewAmenity('')
  }

  const removeAmenity = (a: string) =>
    update('amenities', data.amenities.filter(x => x !== a))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSubmitting(true)
    try {
      const url = isEdit ? `/api/coworking-spaces/${spaceId}` : '/api/coworking-spaces'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          totalSpots: Number(data.totalSpots),
          dailyRate: Number(data.dailyRate),
          monthlyRate: Number(data.monthlyRate),
          yearlyRate: Number(data.yearlyRate),
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        if (body.details) {
          const fieldErrors: Record<string, string> = {}
          for (const e of body.details) {
            if (e.path?.[0]) fieldErrors[e.path[0]] = e.message
          }
          setErrors(fieldErrors)
        }
        toast.error(body.error || 'Erreur lors de l’enregistrement')
        return
      }
      toast.success(isEdit ? 'Espace mis à jour' : 'Espace créé')
      router.push('/dashboard/espaces-coworking')
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
        <Link
          href="/dashboard/espaces-coworking"
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Modifier l’espace' : 'Nouvel espace coworking'}
          </h1>
          <p className="text-gray-600">
            {isEdit ? 'Modifiez les paramètres de l’espace' : 'Créez un nouvel espace de coworking'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Identification</h2>
          <div className="space-y-4">
            <div>
              <label className="form-label">Nom <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={data.name}
                onChange={e => update('name', e.target.value)}
                required
                placeholder="Open Space Bruxelles"
                className={`form-input ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="form-label">Description</label>
              <textarea
                value={data.description}
                onChange={e => update('description', e.target.value)}
                rows={3}
                placeholder="Espace de coworking ouvert avec vue sur la ville..."
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Centre <span className="text-red-500">*</span></label>
              <select
                value={data.centerId}
                onChange={e => update('centerId', e.target.value)}
                required
                className={`form-input ${errors.centerId ? 'border-red-500' : ''}`}
              >
                <option value="">Sélectionner un centre</option>
                {centers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.centerId && <p className="text-xs text-red-600 mt-1">{errors.centerId}</p>}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Capacité & Tarifs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="form-label">Postes <span className="text-red-500">*</span></label>
              <input
                type="number"
                min={1}
                value={data.totalSpots}
                onChange={e => update('totalSpots', Number(e.target.value))}
                required
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Tarif/jour (€)</label>
              <input
                type="number"
                step="0.01"
                min={0}
                value={data.dailyRate}
                onChange={e => update('dailyRate', Number(e.target.value))}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Tarif/mois (€)</label>
              <input
                type="number"
                step="0.01"
                min={0}
                value={data.monthlyRate}
                onChange={e => update('monthlyRate', Number(e.target.value))}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Tarif/an (€)</label>
              <input
                type="number"
                step="0.01"
                min={0}
                value={data.yearlyRate}
                onChange={e => update('yearlyRate', Number(e.target.value))}
                className="form-input"
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Équipements</h2>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newAmenity}
              onChange={e => setNewAmenity(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addAmenity()
                }
              }}
              placeholder="Ex: WiFi haut débit, Café gratuit..."
              className="form-input flex-1"
            />
            <button
              type="button"
              onClick={addAmenity}
              className="btn-secondary"
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.amenities.length === 0 && (
              <p className="text-sm text-gray-500">Aucun équipement renseigné.</p>
            )}
            {data.amenities.map(a => (
              <span
                key={a}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
              >
                {a}
                <button
                  type="button"
                  onClick={() => removeAmenity(a)}
                  className="hover:text-primary-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            checked={data.isActive}
            onChange={e => update('isActive', e.target.checked)}
            className="h-4 w-4 text-primary-600 rounded border-gray-300"
          />
          <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
            Espace actif
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Link href="/dashboard/espaces-coworking" className="btn-secondary">Annuler</Link>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? 'Enregistrer' : 'Créer l’espace'}
          </button>
        </div>
      </form>
    </div>
  )
}
