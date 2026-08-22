import { useEffect, useRef, useCallback } from 'react'

interface Point {
  x: number
  y: number
  radius: number
  opacity: number
  phase: number
  speed: number
  label?: string
  size: number
}

const CRYPTO_LABELS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOT', 'AVAX', 'LINK', 'MATIC', 'DOGE', 'SHIB', 'UNI', 'NEAR', 'FTM']

export function MarketRadar() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const pointsRef = useRef<Point[]>([])
  const angleRef = useRef(0)
  const timeRef = useRef(0)

  const initPoints = useCallback((w: number, h: number) => {
    const cx = w / 2
    const cy = h / 2
    const maxR = Math.min(w, h) * 0.42
    const pts: Point[] = []
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2
      const dist = 0.15 + Math.random() * 0.8
      pts.push({
        x: cx + Math.cos(angle) * maxR * dist,
        y: cy + Math.sin(angle) * maxR * dist,
        radius: 1.5 + Math.random() * 2.5,
        opacity: 0,
        phase: Math.random() * Math.PI * 2,
        speed: 0.8 + Math.random() * 2.5,
        size: 6 + Math.random() * 4,
        label: i < CRYPTO_LABELS.length ? CRYPTO_LABELS[i] : undefined,
      })
    }
    pointsRef.current = pts
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    const w = rect.width
    const h = rect.height
    const cx = w / 2
    const cy = h / 2
    const maxR = Math.min(w, h) * 0.42
    initPoints(w, h)

    const draw = () => {
      timeRef.current += 0.016
      angleRef.current += 0.008
      ctx.clearRect(0, 0, w, h)
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 1.1)
      glow.addColorStop(0, 'rgba(0, 255, 170, 0.03)')
      glow.addColorStop(0.6, 'rgba(0, 255, 170, 0.01)')
      glow.addColorStop(1, 'transparent')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, w, h)
      for (let i = 1; i <= 4; i++) {
        const r = (maxR / 4) * i
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(0, 255, 170, ${0.08 + i * 0.02})`
        ctx.lineWidth = 0.5
        ctx.stroke()
      }
      ctx.strokeStyle = 'rgba(0, 255, 170, 0.06)'
      ctx.lineWidth = 0.5
      for (let a = 0; a < Math.PI; a += Math.PI / 6) {
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(a) * maxR, cy + Math.sin(a) * maxR)
        ctx.lineTo(cx - Math.cos(a) * maxR, cy - Math.sin(a) * maxR)
        ctx.stroke()
      }
      const sweepAngle = angleRef.current
      const beamGrad = ctx.createConicGradient(sweepAngle, cx, cy)
      beamGrad.addColorStop(0, 'rgba(0, 255, 170, 0.15)')
      beamGrad.addColorStop(0.06, 'rgba(0, 255, 170, 0.06)')
      beamGrad.addColorStop(0.12, 'rgba(0, 255, 170, 0)')
      beamGrad.addColorStop(1, 'rgba(0, 255, 170, 0)')
      ctx.beginPath()
      ctx.arc(cx, cy, maxR, 0, Math.PI * 2)
      ctx.fillStyle = beamGrad
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + Math.cos(sweepAngle) * maxR, cy + Math.sin(sweepAngle) * maxR)
      ctx.strokeStyle = 'rgba(0, 255, 170, 0.6)'
      ctx.lineWidth = 1.5
      ctx.stroke()
      pointsRef.current.forEach(pt => {
        const dx = pt.x - cx
        const dy = pt.y - cy
        const ptAngle = Math.atan2(dy, dx)
        let angleDiff = sweepAngle - ptAngle
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
        const inSweep = angleDiff > -0.1 && angleDiff < 0.6
        const sweepFade = inSweep ? Math.max(0, 1 - Math.abs(angleDiff) * 2) : 0
        const pulse = Math.sin(timeRef.current * pt.speed + pt.phase) * 0.5 + 0.5
        pt.opacity = 0.08 + pulse * 0.15 + sweepFade * 0.8
        if (pt.opacity < 0.05) return
        if (sweepFade > 0.3) {
          ctx.beginPath()
          ctx.arc(pt.x, pt.y, pt.radius * 4 * sweepFade, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(0, 255, 170, ${sweepFade * 0.12})`
          ctx.fill()
        }
        const pGrad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, pt.radius * 3)
        pGrad.addColorStop(0, `rgba(0, 255, 170, ${pt.opacity})`)
        pGrad.addColorStop(1, 'rgba(0, 255, 170, 0)')
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, pt.radius * 3, 0, Math.PI * 2)
        ctx.fillStyle = pGrad
        ctx.fill()
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0, 255, 170, ${pt.opacity})`
        ctx.fill()
        if (pt.label && pt.opacity > 0.4) {
          ctx.font = `600 ${pt.size}px system-ui, -apple-system, sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'bottom'
          ctx.fillStyle = `rgba(0, 255, 170, ${pt.opacity * 0.9})`
          ctx.fillText(pt.label, pt.x, pt.y - pt.radius * 2 - 2)
        }
      })
      ctx.beginPath()
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(0, 255, 170, 0.7)'
      ctx.fill()
      const centerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 8)
      centerGlow.addColorStop(0, 'rgba(0, 255, 170, 0.25)')
      centerGlow.addColorStop(1, 'rgba(0, 255, 170, 0)')
      ctx.beginPath()
      ctx.arc(cx, cy, 8, 0, Math.PI * 2)
      ctx.fillStyle = centerGlow
      ctx.fill()
      animRef.current = requestAnimationFrame(draw)
    }
    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [initPoints])

  return (
    <div className="relative flex flex-col items-center">
      <canvas ref={canvasRef} className="w-[200px] h-[200px] sm:w-[220px] sm:h-[220px]" style={{ imageRendering: 'auto' }} />
      <div className="absolute bottom-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/70 backdrop-blur-sm border border-primary/20">
        <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" /></span>
        <span className="text-[10px] font-medium text-emerald-400 tracking-wider uppercase">Scanning Market</span>
      </div>
    </div>
  )
}