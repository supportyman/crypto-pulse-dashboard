import { useEffect, useRef, useCallback } from 'react'

interface Point { x: number; y: number; radius: number; opacity: number; phase: number; speed: number; label?: string; size: number }
const CRYPTO_LABELS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOT', 'AVAX', 'LINK', 'MATIC', 'DOGE', 'SHIB', 'UNI', 'NEAR', 'FTM']

export function MarketRadar() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const pointsRef = useRef<Point[]>([])
  const angleRef = useRef(0)

  const initPoints = useCallback((w: number, h: number) => {
    const cx = w / 2
    const cy = h / 2
    const maxR = Math.min(w, h) * 0.42
    const pts: Point[] = []
    for (let i = 0; i < 18; i++) {
      const angle = (Math.PI * 2 * i) / 18 + (Math.random() - 0.5) * 0.5
      const dist = 0.15 + Math.random() * 0.75
      pts.push({ x: cx + Math.cos(angle) * maxR * dist, y: cy + Math.sin(angle) * maxR * dist, radius: 1.5 + Math.random() * 2, opacity: 0, phase: Math.random() * Math.PI * 2, speed: 0.5 + Math.random() * 1.5, label: i < CRYPTO_LABELS.length ? CRYPTO_LABELS[i] : undefined, size: 3 + Math.random() * 3 })
    }
    pointsRef.current = pts
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const w = 140
    const h = 140
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    ctx.scale(dpr, dpr)
    initPoints(w, h)
    let time = 0
    const cx = w / 2
    const cy = h / 2
    const maxR = Math.min(w, h) * 0.42

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      time += 0.008
      angleRef.current = time * 0.8

      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 1.1)
      glow.addColorStop(0, 'rgba(34, 197, 94, 0.06)')
      glow.addColorStop(1, 'rgba(34, 197, 94, 0)')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(cx, cy, maxR * 1.1, 0, Math.PI * 2)
      ctx.fill()

      for (let i = 1; i <= 4; i++) {
        ctx.beginPath()
        ctx.arc(cx, cy, maxR * (i / 4), 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.1)'
        ctx.lineWidth = 0.5
        ctx.stroke()
      }

      ctx.beginPath()
      ctx.moveTo(cx - maxR, cy)
      ctx.lineTo(cx + maxR, cy)
      ctx.moveTo(cx, cy - maxR)
      ctx.lineTo(cx, cy + maxR)
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.08)'
      ctx.lineWidth = 0.5
      ctx.stroke()

      const sweepAngle = angleRef.current % (Math.PI * 2)
      const sweepGrad = ctx.createConicGradient(sweepAngle - Math.PI / 2, cx, cy)
      sweepGrad.addColorStop(0, 'rgba(34, 197, 94, 0.18)')
      sweepGrad.addColorStop(0.15, 'rgba(34, 197, 94, 0)')
      sweepGrad.addColorStop(1, 'rgba(34, 197, 94, 0)')
      ctx.fillStyle = sweepGrad
      ctx.beginPath()
      ctx.arc(cx, cy, maxR, 0, Math.PI * 2)
      ctx.fill()

      const pts = pointsRef.current
      for (const p of pts) {
        const dx = p.x - cx
        const dy = p.y - cy
        const pointAngle = Math.atan2(dy, dx)
        let angleDiff = sweepAngle - pointAngle
        while (angleDiff < 0) angleDiff += Math.PI * 2
        while (angleDiff > Math.PI * 2) angleDiff -= Math.PI * 2
        const proximity = angleDiff < 0.4 ? 1 - angleDiff / 0.4 : 0
        const blink = 0.15 + 0.85 * (0.5 + 0.5 * Math.sin(time * p.speed + p.phase))
        p.opacity = Math.max(0.15, proximity * 1.0 + blink * 0.5)
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > maxR) continue
        const isActive = proximity > 0.5 || p.opacity > 0.7
        const drawRadius = isActive ? p.radius * 1.8 : p.radius
        const glowRadius = isActive ? drawRadius * 4 : drawRadius * 2
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius)
        grd.addColorStop(0, `rgba(34, 197, 94, ${p.opacity * 0.8})`)
        grd.addColorStop(0.5, `rgba(34, 197, 94, ${p.opacity * 0.3})`)
        grd.addColorStop(1, 'rgba(34, 197, 94, 0)')
        ctx.fillStyle = grd
        ctx.beginPath()
        ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = `rgba(34, 197, 94, ${p.opacity})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, drawRadius, 0, Math.PI * 2)
        ctx.fill()
        if (isActive && p.label) {
          ctx.font = '600 7px Inter, system-ui, sans-serif'
          ctx.fillStyle = `rgba(34, 197, 94, ${Math.min(1, p.opacity + 0.2)})`
          ctx.textAlign = 'center'
          ctx.fillText(p.label, p.x, p.y - drawRadius - 4)
        }
      }

      ctx.beginPath()
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(34, 197, 94, 0.9)'
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx, cy, 5, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)'
      ctx.lineWidth = 0.5
      ctx.stroke()

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [initPoints])

  return (
    <div className="relative flex flex-col items-center">
      <canvas ref={canvasRef} className="block" />
      <div className="flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full bg-card/60 border border-border/30"><span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" /></span><span className="text-[9px] text-muted-foreground font-medium">Scanning Market</span></div>
    </div>
  )
}