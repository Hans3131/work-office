import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireRole } from '@/lib/api-auth'
import { z } from 'zod'

const updateSchema = z.object({
  recipient: z.string().min(1).optional(),
  sender: z.string().optional(),
  enterpriseId: z.string().optional().nullable(),
  status: z.enum(['RECEIVED', 'COLLECTED', 'RETURNED']).optional(),
  notes: z.string().optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const mail = await prisma.mail.findUnique({
      where: { id: params.id },
      include: {
        enterprise: { select: { id: true, name: true } },
        center: { select: { id: true, name: true } },
      },
    })
    if (!mail) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(mail)
  } catch (err) {
    console.error('Error fetching mail:', err)
    return NextResponse.json({ error: 'Failed to fetch mail' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireRole('ADMIN', 'MANAGER')
  if (error) return error

  try {
    const body = await request.json()
    const data = updateSchema.parse(body)

    const existing = await prisma.mail.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updateData: any = { ...data }
    if (data.status === 'COLLECTED' && existing.status !== 'COLLECTED') {
      updateData.collectedAt = new Date()
    }
    if (data.status && data.status !== 'COLLECTED') {
      updateData.collectedAt = null
    }

    const mail = await prisma.mail.update({
      where: { id: params.id },
      data: updateData,
      include: { enterprise: { select: { id: true, name: true } } },
    })
    return NextResponse.json(mail)
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.errors }, { status: 400 })
    }
    if (err?.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    console.error('Error updating mail:', err)
    return NextResponse.json({ error: 'Failed to update mail' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireRole('ADMIN', 'MANAGER')
  if (error) return error

  try {
    await prisma.mail.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err?.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    console.error('Error deleting mail:', err)
    return NextResponse.json({ error: 'Failed to delete mail' }, { status: 500 })
  }
}
