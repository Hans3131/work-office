'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import CoworkingForm, { CoworkingFormData } from '@/components/CoworkingForm'
import { parseJsonArray } from '@/lib/json-array'

export default function EditCoworkingPage({ params }: { params: { id: string } }) {
  const [initial, setInitial] = useState<Partial<CoworkingFormData> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/coworking-spaces/${params.id}`)
      .then(r => (r.ok ? r.json() : Promise.reject(r)))
      .then(s => {
        setInitial({
          name: s.name,
          description: s.description || '',
          totalSpots: s.totalSpots,
          dailyRate: s.dailyRate,
          monthlyRate: s.monthlyRate,
          yearlyRate: s.yearlyRate,
          amenities: parseJsonArray(s.amenities),
          isActive: s.isActive,
          centerId: s.center?.id || '',
        })
      })
      .catch(() => setError('Espace introuvable'))
  }, [params.id])

  if (error) {
    return (
      <div className="p-6">
        <div className="card p-6 bg-red-50 text-red-700">{error}</div>
      </div>
    )
  }
  if (!initial) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }
  return <CoworkingForm initialData={initial} spaceId={params.id} />
}
