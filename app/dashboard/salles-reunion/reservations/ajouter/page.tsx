'use client'

import { useEffect, useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

interface MeetingRoom {
  id: string
  name: string
  capacity: number
  hourlyRate: number
}

export default function AddReservationPage() {
  const router = useRouter()
  const [rooms, setRooms] = useState<MeetingRoom[]>([])
  const [submitting, setSubmitting] = useState(false)

  const [meetingRoomId, setMeetingRoomId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [startHour, setStartHour] = useState('09:00')
  const [endHour, setEndHour] = useState('10:00')

  useEffect(() => {
    fetch('/api/meeting-rooms')
      .then(r => (r.ok ? r.json() : Promise.reject(r)))
      .then(d => setRooms(d.rooms || d.meetingRooms || []))
      .catch(() => toast.error('Impossible de charger les salles'))
  }, [])

  const room = rooms.find(r => r.id === meetingRoomId)
  const startTime = `${date}T${startHour}:00`
  const endTime = `${date}T${endHour}:00`
  const durationH = (() => {
    const [sh, sm] = startHour.split(':').map(Number)
    const [eh, em] = endHour.split(':').map(Number)
    return ((eh + em / 60) - (sh + sm / 60))
  })()
  const total = room ? Math.max(0, durationH * room.hourlyRate) : 0

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (durationH <= 0) {
      toast.error('L’heure de fin doit être après l’heure de début')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingRoomId,
          title,
          description: description || undefined,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          totalAmount: total,
          status: 'CONFIRMED',
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error || 'Erreur')
        return
      }
      toast.success('Réservation créée')
      router.push('/dashboard/salles-reunion/reservations')
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
        <Link href="/dashboard/salles-reunion/reservations" className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-7 w-7 text-primary-600" />
            Nouvelle réservation
          </h1>
          <p className="text-gray-600">Réserver un créneau dans une salle de réunion</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div>
          <label className="form-label">Salle <span className="text-red-500">*</span></label>
          <select
            value={meetingRoomId}
            onChange={e => setMeetingRoomId(e.target.value)}
            required
            className="form-input"
          >
            <option value="">Sélectionner une salle</option>
            {rooms.map(r => (
              <option key={r.id} value={r.id}>
                {r.name} — {r.capacity} pers. — {r.hourlyRate} €/h
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label">Titre de la réunion <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            placeholder="Ex: Réunion équipe marketing"
            className="form-input"
          />
        </div>

        <div>
          <label className="form-label">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className="form-input"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Début <span className="text-red-500">*</span></label>
            <input
              type="time"
              value={startHour}
              onChange={e => setStartHour(e.target.value)}
              required
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Fin <span className="text-red-500">*</span></label>
            <input
              type="time"
              value={endHour}
              onChange={e => setEndHour(e.target.value)}
              required
              className="form-input"
            />
          </div>
        </div>

        {room && durationH > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Durée</span>
              <span className="font-medium">{durationH.toFixed(1)} h</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600">Tarif horaire</span>
              <span className="font-medium">{room.hourlyRate.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between pt-2 mt-2 border-t border-gray-200">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-bold text-primary-600">{total.toFixed(2)} €</span>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Link href="/dashboard/salles-reunion/reservations" className="btn-secondary">Annuler</Link>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Réserver
          </button>
        </div>
      </form>
    </div>
  )
}
