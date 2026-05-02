'use client'

import { useState, FormEvent } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Eye, EyeOff, Loader2, Sparkles, Building, Users, Shield, Activity,
  CheckCircle2, ArrowRight, Quote,
} from 'lucide-react'
import { Button, Field, Input, Checkbox, Card, Badge } from '@/components/ui'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.error) {
        setError('Email ou mot de passe incorrect')
      } else {
        toast.success('Connexion réussie')
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setError('Une erreur est survenue. Réessayez.')
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemo = (mail: string, pwd: string) => {
    setEmail(mail)
    setPassword(pwd)
  }

  return (
    <div className="min-h-screen flex bg-bg">
      {/* ============================================================
          PANEL GAUCHE — Branding premium avec mesh gradient
          ============================================================ */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-ink-900">
        {/* Mesh gradient layers */}
        <div className="absolute inset-0">
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-electric-600/30 blur-[100px]" />
          <div className="absolute top-20 right-0 w-[400px] h-[400px] rounded-full bg-gold-500/15 blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[400px] rounded-full bg-primary-700/20 blur-[100px]" />
        </div>

        {/* Grid pattern subtle */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full text-white">
          {/* Top : logo */}
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="relative h-11 w-11">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl border border-white/10" />
              <div className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-gold-400 ring-2 ring-ink-900" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" strokeWidth={2} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold tracking-tight">WorkOffice</span>
                <Badge tone="gold" size="sm">v2.0</Badge>
              </div>
              <p className="text-2xs text-white/50 leading-none mt-1">Prestigia App</p>
            </div>
          </div>

          {/* Middle : hero */}
          <div className="space-y-8 animate-slide-up">
            <div>
              <h1 className="text-4xl xl:text-5xl font-semibold tracking-tighter leading-[1.1]">
                Pilotez vos centres
                <br />
                <span className="bg-gradient-to-r from-gold-300 via-gold-400 to-gold-500 bg-clip-text text-transparent">
                  comme jamais.
                </span>
              </h1>
              <p className="mt-4 text-md text-white/70 max-w-md leading-relaxed">
                La plateforme tout-en-un pour gérer la domiciliation, les salles, les courriers
                et la facturation de vos espaces de coworking.
              </p>
            </div>

            {/* Features list */}
            <ul className="space-y-3">
              {[
                'Domiciliation et gestion d\'entreprises',
                'Réservation de salles et coworking',
                'Facturation automatisée et suivi paiements',
                'Analytics temps réel multi-centres',
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-white/80">
                  <div className="h-5 w-5 rounded-full bg-gold-400/15 ring-1 ring-gold-400/30 inline-flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-3 w-3 text-gold-400" strokeWidth={2.5} />
                  </div>
                  {f}
                </li>
              ))}
            </ul>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
              <div>
                <p className="text-2xl font-semibold tracking-tighter nums-tabular">4</p>
                <p className="text-2xs text-white/50 uppercase tracking-wider">Centres</p>
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tighter nums-tabular">99.9%</p>
                <p className="text-2xs text-white/50 uppercase tracking-wider">Uptime</p>
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tighter nums-tabular">24/7</p>
                <p className="text-2xs text-white/50 uppercase tracking-wider">Support</p>
              </div>
            </div>
          </div>

          {/* Bottom : testimonial + footer */}
          <div className="space-y-4">
            <div className="relative pl-6">
              <Quote className="absolute left-0 top-0 h-4 w-4 text-gold-400/60" />
              <blockquote className="text-sm text-white/80 italic leading-relaxed">
                « Une refonte complète qui a divisé par 3 le temps passé sur la gestion administrative. »
              </blockquote>
              <p className="mt-2 text-2xs text-white/50">
                — Sophie M., Manager · Centre Bruxelles
              </p>
            </div>
            <p className="text-2xs text-white/40">
              © {new Date().getFullYear()} Prestigia · Tous droits réservés
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================
          PANEL DROIT — Formulaire de connexion
          ============================================================ */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md animate-slide-up">
          {/* Logo mobile (visible < lg) */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="relative h-10 w-10">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-ink-700 to-ink-900 shadow-soft-md" />
              <div className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-gold-500 ring-2 ring-ink-700" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <div>
              <div className="text-md font-semibold tracking-tight">WorkOffice</div>
              <div className="text-2xs text-text-subtle leading-none">Prestigia App</div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-semibold tracking-tighter text-text">
              Bon retour 👋
            </h2>
            <p className="text-sm text-text-muted mt-1.5">
              Connectez-vous pour accéder à votre espace de gestion.
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-danger-soft border border-danger/20 text-sm text-danger animate-slide-down">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Email professionnel" required>
              <Input
                type="email"
                placeholder="email@workoffice.be"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                size="lg"
                disabled={isLoading}
              />
            </Field>

            <Field
              label={
                <div className="flex items-center justify-between">
                  <span>Mot de passe</span>
                  <Link
                    href="/auth/forgot-password"
                    className="text-2xs text-text-muted hover:text-text transition-colors"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div> as any
              }
              required
            >
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                size="lg"
                disabled={isLoading}
                iconRight={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-text-muted hover:text-text"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
            </Field>

            <label className="flex items-center gap-2 cursor-pointer group">
              <Checkbox
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
              />
              <span className="text-sm text-text-muted group-hover:text-text transition-colors">
                Se souvenir de moi pendant 30 jours
              </span>
            </label>

            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={isLoading}
              iconRight={!isLoading ? <ArrowRight className="h-4 w-4" /> : undefined}
            >
              Se connecter
            </Button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-text-muted">Comptes de démonstration</p>
              <Badge tone="gold" size="sm">Demo</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('admin@workoffice.be', 'admin123')}
                className="text-left p-3 rounded-lg border border-border bg-surface hover:bg-surface-2 hover:border-border-strong transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-3.5 w-3.5 text-gold-500" strokeWidth={2} />
                  <span className="text-xs font-medium text-text">Admin</span>
                </div>
                <p className="text-2xs text-text-subtle font-mono truncate">admin@workoffice.be</p>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('manager@workoffice.be', 'manager123')}
                className="text-left p-3 rounded-lg border border-border bg-surface hover:bg-surface-2 hover:border-border-strong transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-3.5 w-3.5 text-info" strokeWidth={2} />
                  <span className="text-xs font-medium text-text">Manager</span>
                </div>
                <p className="text-2xs text-text-subtle font-mono truncate">manager@workoffice.be</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
