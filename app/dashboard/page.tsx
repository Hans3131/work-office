'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Euro, Users, Building, Calendar, Package, Mail, AlertTriangle, UserPlus,
  TrendingUp, Activity, Plus, Receipt, Inbox, MapPin, CalendarDays,
  ArrowRight, Sparkles, Clock, ChevronRight,
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import {
  PageHeader, KpiCard, StatGrid, Card, Badge, StatusBadge, Avatar,
  Spinner, EmptyState,
} from '@/components/ui'
import { cn, formatCurrency } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface OverviewData {
  kpis: any
  revenueChart: { month: string; value: number }[]
  centersSummary: any[]
  activity: any[]
  alerts: {
    overdueInvoices: any[]
    packagesPending: number
    mailsPending: number
  }
}

const ACTIVITY_ICONS: Record<string, LucideIcon> = {
  invoice: Receipt,
  package: Package,
  mail: Mail,
  enterprise: Building,
}

const ACTIVITY_COLORS: Record<string, string> = {
  invoice: 'bg-success-soft text-success',
  package: 'bg-gold-50 text-gold-700 dark:bg-gold-900/30 dark:text-gold-400',
  mail: 'bg-info-soft text-info',
  enterprise: 'bg-electric-50 text-electric-600 dark:bg-electric-900/30 dark:text-electric-400',
}

const QUICK_ACTIONS = [
  { label: 'Ajouter une entreprise', href: '/dashboard/entreprises/nouveau', icon: Building, tone: 'electric' },
  { label: 'Créer une facture', href: '/dashboard/facturation/nouveau', icon: Receipt, tone: 'success' },
  { label: 'Enregistrer un colis', href: '/dashboard/colis/nouveau', icon: Package, tone: 'gold' },
  { label: 'Réserver une salle', href: '/dashboard/salles-reunion/reservations/ajouter', icon: CalendarDays, tone: 'info' },
] as const

const TONE_CLASSES: Record<string, string> = {
  electric: 'bg-electric-50 text-electric-600 dark:bg-electric-900/30 dark:text-electric-400 group-hover:bg-electric-600 group-hover:text-white',
  success: 'bg-success-soft text-success group-hover:bg-success group-hover:text-white',
  gold: 'bg-gold-50 text-gold-700 dark:bg-gold-900/30 dark:text-gold-400 group-hover:bg-gold-500 group-hover:text-white',
  info: 'bg-info-soft text-info group-hover:bg-info group-hover:text-white',
}

const formatRelative = (date: string | Date) => {
  const d = new Date(date)
  const diff = Date.now() - d.getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'à l\'instant'
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h} h`
  const days = Math.floor(h / 24)
  if (days === 1) return 'hier'
  if (days < 7) return `il y a ${days} j`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function DashboardPage() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/dashboard/overview')
      .then(r => (r.ok ? r.json() : Promise.reject(r)))
      .then(setData)
      .catch(() => setError('Erreur lors du chargement'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader
          title="Vue d'ensemble"
          description="Suivez l'activité de vos centres, vos revenus et vos opérations en temps réel."
        />
        <StatGrid cols={4} gap="md">
          {[...Array(8)].map((_, i) => (
            <KpiCard key={i} label="" value="" loading />
          ))}
        </StatGrid>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <EmptyState
            icon={AlertTriangle}
            title="Impossible de charger les données"
            description={error || 'Réessayer dans un instant'}
          />
        </Card>
      </div>
    )
  }

  const { kpis, revenueChart, centersSummary, activity, alerts } = data
  const todayLabel = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Vue d'ensemble"
        description={`${todayLabel.charAt(0).toUpperCase() + todayLabel.slice(1)} · Suivi temps réel de vos opérations`}
        actions={
          <Link
            href="/dashboard/kpis_personnel"
            className="btn btn-secondary"
          >
            <Activity className="h-4 w-4" />
            Analytics complets
          </Link>
        }
      />

      {/* 8 KPIs en grid */}
      <StatGrid cols={4} gap="md">
        <KpiCard
          label="Chiffre d'affaires"
          value={formatCurrency(kpis.revenue.value)}
          sublabel="ce mois"
          icon={Euro}
          tone="success"
          delta={kpis.revenue.delta}
          trend={kpis.revenue.trend}
        />
        <KpiCard
          label="Entreprises actives"
          value={kpis.activeEnterprises.value.toLocaleString('fr-FR')}
          sublabel="domiciliées"
          icon={Building}
          tone="electric"
          delta={kpis.activeEnterprises.delta}
          trend={kpis.activeEnterprises.trend}
        />
        <KpiCard
          label="Réservations du jour"
          value={kpis.reservationsToday.value}
          sublabel="confirmées"
          icon={Calendar}
          tone="gold"
          trend={kpis.reservationsToday.trend}
        />
        <KpiCard
          label="Utilisateurs actifs"
          value={kpis.activeUsers.value}
          sublabel={`${kpis.activeUsers.newThisMonth} nouveau(x) ce mois`}
          icon={Users}
          tone="info"
        />
        <KpiCard
          label="Colis en attente"
          value={kpis.packagesPending.value}
          sublabel="à récupérer"
          icon={Package}
          tone="warning"
          trend={kpis.packagesPending.trend}
        />
        <KpiCard
          label="Courriers à enlever"
          value={kpis.mailsPending.value}
          sublabel="reçus, non récupérés"
          icon={Mail}
          tone="info"
        />
        <KpiCard
          label="Factures en retard"
          value={kpis.overdueInvoices.value}
          sublabel={kpis.overdueInvoices.amount > 0 ? `${formatCurrency(kpis.overdueInvoices.amount)} à recouvrer` : undefined}
          icon={AlertTriangle}
          tone="danger"
          delta={kpis.overdueInvoices.delta}
          deltaIntent="negative"
        />
        <KpiCard
          label="Revenu cumulé"
          value={formatCurrency(kpis.revenueTotal.value)}
          sublabel="historique total"
          icon={TrendingUp}
          tone="primary"
        />
      </StatGrid>

      {/* Revenue chart + Centers summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart revenus 12 mois */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-md font-semibold tracking-tight text-text">Évolution des revenus</h3>
              <p className="text-xs text-text-muted mt-0.5">Factures payées sur les 12 derniers mois</p>
            </div>
            <Badge tone="success" dot>
              {kpis.revenue.delta >= 0 ? '+' : ''}{kpis.revenue.delta}% mois précédent
            </Badge>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueChart}>
              <defs>
                <linearGradient id="revenue-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="rgb(var(--text-subtle))"
                fontSize={11}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="rgb(var(--text-subtle))"
                fontSize={11}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgb(var(--surface))',
                  border: '1px solid rgb(var(--border))',
                  borderRadius: 12,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                  fontSize: 12,
                }}
                formatter={(v: number) => [formatCurrency(v), 'Revenus']}
                cursor={{ stroke: '#3B82F6', strokeWidth: 1, strokeDasharray: '3 3' }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3B82F6"
                strokeWidth={2.5}
                fill="url(#revenue-grad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Centers summary */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="text-md font-semibold tracking-tight text-text">Centres</h3>
              <p className="text-xs text-text-muted mt-0.5">Vue d'ensemble multi-sites</p>
            </div>
            <Link href="/dashboard/centers" className="text-xs text-text-muted hover:text-text transition-colors">
              Tout voir
            </Link>
          </div>
          <div className="space-y-3">
            {centersSummary.length === 0 ? (
              <EmptyState
                icon={MapPin}
                title="Aucun centre"
                description="Crée ton premier centre pour démarrer"
                compact
              />
            ) : (
              centersSummary.map((c: any) => (
                <Link
                  key={c.id}
                  href="/dashboard/centers"
                  className="block p-3 -mx-3 rounded-xl hover:bg-surface-2/60 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text truncate flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-text-subtle shrink-0" />
                        {c.name}
                      </p>
                      <p className="text-2xs text-text-subtle mt-0.5">{c.city}</p>
                    </div>
                    <Badge tone={c.occupancy > 70 ? 'warning' : c.occupancy > 30 ? 'info' : 'neutral'} size="sm">
                      {c.occupancy}% occ.
                    </Badge>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-2xs text-text-muted">
                    <span><strong className="text-text font-medium">{c.enterprises}</strong> ent.</span>
                    <span><strong className="text-text font-medium">{c.rooms}</strong> salles</span>
                    <span><strong className="text-text font-medium">{c.activeSubs}</strong> abos</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* 3 colonnes : Activity + Alerts + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Activité récente */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="text-md font-semibold tracking-tight text-text">Activité récente</h3>
              <p className="text-xs text-text-muted mt-0.5">Dernières opérations sur la plateforme</p>
            </div>
          </div>

          {activity.length === 0 ? (
            <EmptyState icon={Activity} title="Pas encore d'activité" compact />
          ) : (
            <ul className="space-y-1">
              {activity.map((a: any) => {
                const Icon = ACTIVITY_ICONS[a.type] || Activity
                return (
                  <li key={`${a.type}-${a.id}`}>
                    <Link
                      href={a.href}
                      className="flex items-start gap-3 px-3 py-2.5 -mx-3 rounded-xl hover:bg-surface-2/60 transition-colors group"
                    >
                      <div className={cn(
                        'h-9 w-9 shrink-0 rounded-lg inline-flex items-center justify-center',
                        ACTIVITY_COLORS[a.type]
                      )}>
                        <Icon className="h-4 w-4" strokeWidth={1.75} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-sm font-medium text-text truncate">{a.title}</p>
                          <span className="text-2xs text-text-subtle shrink-0 nums-tabular">
                            {formatRelative(a.date)}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted truncate">{a.description}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-text-subtle opacity-0 group-hover:opacity-100 transition-opacity self-center" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        {/* Alertes + Quick actions */}
        <div className="space-y-5">
          {/* Alertes opérationnelles */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-md font-semibold tracking-tight text-text flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Alertes
                </h3>
                <p className="text-xs text-text-muted mt-0.5">À traiter en priorité</p>
              </div>
            </div>

            <div className="space-y-2">
              {alerts.overdueInvoices.length === 0 && alerts.packagesPending === 0 && alerts.mailsPending === 0 ? (
                <div className="text-center py-4">
                  <Sparkles className="h-6 w-6 mx-auto text-success mb-2" />
                  <p className="text-xs text-text-muted">Tout est sous contrôle</p>
                </div>
              ) : (
                <>
                  {alerts.overdueInvoices.slice(0, 3).map((inv: any) => (
                    <Link
                      key={inv.id}
                      href={`/dashboard/facturation/${inv.id}`}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-danger-soft/40 hover:bg-danger-soft transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-text truncate">{inv.number}</p>
                        <p className="text-2xs text-text-muted truncate">
                          {inv.enterpriseName} · {inv.daysOverdue}j de retard
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-danger nums-tabular shrink-0 ml-2">
                        {formatCurrency(inv.totalAmount)}
                      </span>
                    </Link>
                  ))}
                  {alerts.packagesPending > 0 && (
                    <Link
                      href="/dashboard/colis"
                      className="flex items-center justify-between p-2.5 rounded-lg bg-warning-soft/40 hover:bg-warning-soft transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Package className="h-3.5 w-3.5 text-warning" />
                        <p className="text-xs text-text">{alerts.packagesPending} colis à récupérer</p>
                      </div>
                      <ArrowRight className="h-3 w-3 text-warning" />
                    </Link>
                  )}
                  {alerts.mailsPending > 0 && (
                    <Link
                      href="/dashboard/courriers-a-enlever"
                      className="flex items-center justify-between p-2.5 rounded-lg bg-info-soft/40 hover:bg-info-soft transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-info" />
                        <p className="text-xs text-text">{alerts.mailsPending} courrier(s) à enlever</p>
                      </div>
                      <ArrowRight className="h-3 w-3 text-info" />
                    </Link>
                  )}
                </>
              )}
            </div>
          </Card>

          {/* Quick actions */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-md font-semibold tracking-tight text-text">Actions rapides</h3>
                <p className="text-xs text-text-muted mt-0.5">Raccourcis essentiels</p>
              </div>
              <Plus className="h-4 w-4 text-text-subtle" />
            </div>
            <ul className="space-y-1">
              {QUICK_ACTIONS.map(a => (
                <li key={a.label}>
                  <Link
                    href={a.href}
                    className="group flex items-center gap-3 p-2.5 -mx-2.5 rounded-xl hover:bg-surface-2/60 transition-colors"
                  >
                    <div
                      className={cn(
                        'h-9 w-9 shrink-0 rounded-lg inline-flex items-center justify-center transition-colors duration-200',
                        TONE_CLASSES[a.tone]
                      )}
                    >
                      <a.icon className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                    <span className="flex-1 text-sm text-text font-medium">{a.label}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-text-subtle group-hover:text-text group-hover:translate-x-0.5 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
