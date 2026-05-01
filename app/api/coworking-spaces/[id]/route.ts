import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireRole } from '@/lib/api-auth'
import { stringifyJsonArray } from '@/lib/json-array'
import { z } from 'zod'

const spaceSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  totalSpots: z.number().int().positive().optional(),
  dailyRate: z.number().nonnegative().optional(),
  monthlyRate: z.number().nonnegative().optional(),
  yearlyRate: z.number().nonnegative().optional(),
  amenities: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  centerId: z.string().min(1).optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const space = await prisma.coworkingSpace.findUnique({
      where: { id: params.id },
      include: {
        center: { select: { id: true, name: true } },
        _count: { select: { subscriptions: true } },
      },
    })
    if (!space) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(space)
  } catch (err) {
    console.error('Error fetching coworking space:', err)
    return NextResponse.json({ error: 'Failed to fetch coworking space' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireRole('ADMIN', 'MANAGER')
  if (error) return error

  try {
    const body = await request.json()
    const data = spaceSchema.parse(body)

    // Manager : peut modifier uniquement dans son centre
    if (session!.user.role === 'MANAGER') {
      const existing = await prisma.coworkingSpace.findUnique({
        where: { id: params.id },
        select: { centerId: true },
      })
      if (!existing || existing.centerId !== session!.user.centerId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const updateData: any = { ...data }
    if (data.amenities !== undefined) {
      updateData.amenities = stringifyJsonArray(data.amenities)
    }

    const space = await prisma.coworkingSpace.update({
      where: { id: params.id },
      data: updateData,
    })
    return NextResponse.json(space)
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: err.errors },
        { status: 400 }
      )
    }
    if (err?.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    console.error('Error updating coworking space:', err)
    return NextResponse.json({ error: 'Failed to update coworking space' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireRole('ADMIN')
  if (error) return error

  try {
    const counts = await prisma.coworkingSpace.findUnique({
      where: { id: params.id },
      include: { _count: { select: { subscriptions: true } } },
    })
    if (!counts) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (counts._count.subscriptions > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer cet espace : des abonnements y sont rattachés.' },
        { status: 409 }
      )
    }

    await prisma.coworkingSpace.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err?.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    console.error('Error deleting coworking space:', err)
    return NextResponse.json({ error: 'Failed to delete coworking space' }, { status: 500 })
  }
}
