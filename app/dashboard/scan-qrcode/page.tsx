'use client'

import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { QrCode, Camera, X, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface ScanLog {
  code: string
  ts: string
  type: 'success' | 'error'
}

export default function ScanQRPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animFrameRef = useRef<number>()

  const [scanning, setScanning] = useState(false)
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<string | null>(null)
  const [logs, setLogs] = useState<ScanLog[]>([])
  const [manualCode, setManualCode] = useState('')

  const stopCamera = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setScanning(false)
  }

  const startCamera = async () => {
    setPermissionError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.setAttribute('playsinline', 'true')
        await videoRef.current.play()
      }
      setScanning(true)
      tick()
    } catch (err: any) {
      setPermissionError(
        err.name === 'NotAllowedError'
          ? 'Permission caméra refusée. Autorisez l’accès dans votre navigateur.'
          : 'Impossible d’accéder à la caméra.'
      )
    }
  }

  const tick = () => {
    if (!videoRef.current || !canvasRef.current) return
    if (videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animFrameRef.current = requestAnimationFrame(tick)
      return
    }
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    })
    if (code) {
      handleScanResult(code.data)
    }
    animFrameRef.current = requestAnimationFrame(tick)
  }

  const handleScanResult = (code: string) => {
    if (code === lastResult) return // évite les duplicats consécutifs
    setLastResult(code)
    setLogs(prev => [
      { code, ts: new Date().toLocaleTimeString('fr-FR'), type: 'success' as const },
      ...prev,
    ].slice(0, 20))
    toast.success(`QR scanné : ${code}`)
    // Vibration sur mobile
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(100)
    }
    // Pause de 2s avant de pouvoir rescanner le même code
    setTimeout(() => setLastResult(null), 2000)
  }

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode.trim()) return
    handleScanResult(manualCode.trim())
    setManualCode('')
  }

  useEffect(() => {
    return () => stopCamera()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <QrCode className="h-7 w-7 text-primary-600" />
          Scanner QR Code
        </h1>
        <p className="text-gray-600">Contrôle d’accès et enregistrement des entrées/sorties</p>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Caméra</h2>

        {permissionError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
            <p className="text-sm text-red-700">{permissionError}</p>
          </div>
        )}

        <div className="relative aspect-square max-w-md mx-auto bg-gray-900 rounded-lg overflow-hidden">
          {!scanning && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <Camera className="h-16 w-16 text-gray-600" />
            </div>
          )}
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          <canvas ref={canvasRef} className="hidden" />

          {scanning && (
            <>
              {/* Cadre de scan */}
              <div className="absolute inset-12 border-4 border-primary-500 rounded-lg animate-pulse" />
              <div className="absolute top-4 left-4 right-4 flex justify-between">
                <span className="px-3 py-1 bg-primary-600 text-white text-xs rounded">
                  ● Scan en cours
                </span>
                <button
                  onClick={stopCamera}
                  className="p-2 bg-white/90 hover:bg-white rounded-full"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-center mt-4">
          {scanning ? (
            <button onClick={stopCamera} className="btn-secondary">
              <X className="h-4 w-4" />
              Arrêter le scan
            </button>
          ) : (
            <button onClick={startCamera} className="btn-primary">
              <Camera className="h-4 w-4" />
              Activer la caméra
            </button>
          )}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Saisie manuelle</h2>
        <form onSubmit={submitManual} className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={e => setManualCode(e.target.value)}
            placeholder="Coller / saisir un code..."
            className="form-input flex-1"
          />
          <button type="submit" className="btn-primary">
            Valider
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2">
          Si la caméra n’est pas disponible, vous pouvez saisir manuellement le code à valider.
        </p>
      </div>

      {logs.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Historique des scans</h2>
          <ul className="divide-y divide-gray-100">
            {logs.map((log, i) => (
              <li key={i} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                  <div>
                    <p className="font-mono text-sm text-gray-900 break-all">{log.code}</p>
                    <p className="text-xs text-gray-500">{log.ts}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
