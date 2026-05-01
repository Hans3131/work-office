import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireRole, scopeByCenter } from '@/lib/api-auth'
import { stringifyJsonArray } from '@/lib/json-array'
import { z } from 'zod'

const spaceSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  description: z.string().optional(),
  totalSpots: z.number().int().positive(),
  dailyRate: z.number().nonnegative(),
  monthlyRate: z.number().nonnegative(),
  yearlyRate: z.number().nonnegative(),
  amenities: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  centerId: z.string().min(1),
})

export async function GET(request: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    let where: any = scopeByCenter(session!, {}, 'centerId')
    if (search) where.name = { contains: search, mode: 'insensitive' }

    const spaces = await prisma.coworkingSpace.findMany({
      where,
      include: {
        center: { select: { id: true, name: true } },
        _count: { select: { subscriptions: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ spaces, total: spaces.length })
  } catch (err) {
    console.error('Error fetching coworking spaces:', err)
    return NextResponse.json({ error: 'Failed to fetch coworking spaces' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { error, session } = await requireRole('ADMIN', 'MANAGER')
  if (error) return error

  try {
    const body = await request.json()
    const data = spaceSchema.parse(body)

    if (session!.user.role === 'MANAGER' && data.centerId !== session!.user.centerId) {
      return NextResponse.json({ error: 'Cannot create in another center' }, { status: 403 })
    }

    const space = await prisma.coworkingSpace.create({
      data: {
        name: data.name,
        description: data.description,
        totalSpots: data.totalSpots,
        dailyRate: data.dailyRate,
        monthlyRate: data.monthlyRate,
        yearlyRate: data.yearlyRate,
        amenities: stringifyJsonArray(data.amenities),
        isActive: data.isActive,
        centerId: data.centerId,
      },
    })

    return NextResponse.json(space, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: err.errors },
        { status: 400 }
      )
    }
    console.error('Error creating coworking space:', err)
    return NextResponse.json({ error: 'Failed to create coworking space' }, { status: 500 })
  }
}
