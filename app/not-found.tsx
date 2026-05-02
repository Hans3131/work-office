'use client'

import Link from 'next/link'
import { Home, ArrowLeft, Search } from 'lucide-react'
import { Button } from '@/components/ui'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-bg relative overflow-hidden">
      {/* Background mesh */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-electric-200/30 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-gold-200/30 blur-[120px]" />
      </div>

      <div className="relative max-w-md w-full text-center animate-slide-up">
        {/* 404 number with gradient */}
        <div className="relative inline-block mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-electric-500/20 to-gold-500/20 blur-3xl" />
          <h1 className="relative text-9xl font-semibold tracking-tightest text-gradient-ink leading-none">
            404
          </h1>
        </div>

        <h2 className="text-2xl font-semibold tracking-tight text-text mb-3">
          Page introuvable
        </h2>
        <p className="text-sm text-text-muted mb-8 max-w-sm mx-auto">
          La page que vous recherchez n'existe pas ou a été déplacée. Retournez au tableau de bord
          ou utilisez la recherche.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/dashboard">
            <Button iconLeft={<Home className="h-4 w-4" />}>
              Retour au tableau de bord
            </Button>
          </Link>
          <button
            onClick={() => history.back()}
            className="btn btn-ghost"
          >
            <ArrowLeft className="h-4 w-4" />
            Page précédente
          </button>
        </div>
      </div>
    </div>
  )
}
