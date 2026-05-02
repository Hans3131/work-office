import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function monthLabel(d: Date) {
  return d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
}

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const now = new Date()
    const months: Date[] = []
    for (let i = 11; i >= 0; i--) {
      months.push(startOfMonth(new Date(now.getFullYear(), now.getMonth() - i, 1)))
    }

    // Revenue par mois (factures payées)
    const revenuePerMonth = await Promise.all(
      months.map(async (m, idx) => {
        const next = idx === months.length - 1
          ? new Date(now.getFullYear(), now.getMonth() + 1, 1)
          : months[idx + 1]
        const sum = await prisma.invoice.aggregate({
          where: {
            status: 'PAID',
            paidAt: { gte: m, lt: next },
          },
          _sum: { totalAmount: true },
        })
        return { month: monthLabel(m), revenue: sum._sum.totalAmount || 0 }
      })
    )

    // Nouvelles entreprises par mois
    const newEnterprises = await Promise.all(
      months.map(async (m, idx) => {
        const next = idx === months.length - 1
          ? new Date(now.getFullYear(), now.getMonth() + 1, 1)
          : months[idx + 1]
        const count = await prisma.enterprise.count({
          where: { createdAt: { gte: m, lt: next } },
        })
        return { month: monthLabel(m), count }
      })
    )

    // Statuts entreprises
    const [active, suspended, terminated] = await Promise.all([
      prisma.enterprise.count({ where: { status: 'ACTIVE' } }),
      prisma.enterprise.count({ where: { status: 'SUSPENDED' } }),
      prisma.enterprise.count({ where: { status: 'TERMINATED' } }),
    ])

    // Réservations par centre
    const centers = await prisma.center.findMany({
      select: { id: true, name: true },
    })
    const reservationsPerCenter = await Promise.all(
      centers.map(async c => {
        const count = await prisma.reservation.count({
          where: { meetingRoom: { centerId: c.id } },
        })
        return { center: c.name, count }
      })
    )

    // KPIs synthétiques
    const totalRevenue = revenuePerMonth.reduce((s, m) => s + m.revenue, 0)
    const lastMonthRevenue = revenuePerMonth[revenuePerMonth.length - 1]?.revenue || 0
    const prevMonthRevenue = revenuePerMonth[revenuePerMonth.length - 2]?.revenue || 0
    const revenueGrowth =
      prevMonthRevenue === 0 ? 100 : Math.round(((lastMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)

    const [totalUsers, activeUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
    ])
    const [totalReservations, totalPackages, totalMails] = await Promise.all([
      prisma.reservation.count(),
      prisma.package.count(),
      prisma.mail.count(),
    ])

    // Revenu par type d'abonnement (pie)
    const subs = await prisma.subscription.groupBy({
      by: ['type'],
      where: { isActive: true },
      _count: true,
      _sum: { monthlyAmount: true },
    })

    return NextResponse.json({
      summary: {
        totalRevenue,
        lastMonthRevenue,
        revenueGrowth,
        totalUsers,
        activeUsers,
        totalReservations,
        totalPackages,
        totalMails,
      },
      revenuePerMonth,
      newEnterprises,
      enterprisesByStatus: [
        { name: 'Actives', value: active, color: '#16A34A' },
        { name: 'Suspendues', value: suspended, color: '#CA8A04' },
        { name: 'Résiliées', value: terminated, color: '#DC2626' },
      ],
      reservationsPerCenter,
      subscriptionsByType: subs.map(s => ({
        type: { DAILY: 'Journalier', MONTHLY: 'Mensuel', YEARLY: 'Annuel' }[s.type] || s.type,
        count: s._count,
        revenue: s._sum.monthlyAmount || 0,
      })),
    })
  } catch (err) {
    console.error('Error fetching KPIs:', err)
    return NextResponse.json({ error: 'Failed to fetch KPIs' }, { status: 500 })
  }
}
