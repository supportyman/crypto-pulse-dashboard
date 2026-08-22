import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Bell, Flame, Activity } from 'lucide-react'

interface FearGreedItem { value: string; value_classification: string; timestamp: string }
interface TrendingCoin { item: { name: string; symbol: string; market_cap_rank: number; thumb: string; data: { price: number; price_btc: number; score: number; sparkline: string } } }

function fearColor(val: number): string {
  if (val <= 25) return 'text-red-400'
  if (val <= 45) return 'text-orange-400'
  if (val <= 55) return 'text-yellow-400'
  if (val <= 75) return 'text-emerald-400'
  return 'text-green-400'
}
function fearBg(val: number): string {
  if (val <= 25) return 'bg-red-500'
  if (val <= 45) return 'bg-orange-500'
  if (val <= 55) return 'bg-yellow-500'
  if (val <= 75) return 'bg-emerald-500'
  return 'bg-green-500'
}

export function EventsPopup() {
  const [fearGreed, setFearGreed] = useState<FearGreedItem[]>([])
  const [trending, setTrending] = useState<TrendingCoin[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [fgRes, trRes] = await Promise.allSettled([fetch('/api/crypto/fear-greed'), fetch('/api/crypto/trending')])
      if (fgRes.status === 'fulfilled' && fgRes.value.ok) { const fgData = await fgRes.value.json(); setFearGreed(fgData.data || []) }
      if (trRes.status === 'fulfilled' && trRes.value.ok) { const trData = await trRes.value.json(); setTrending(trData.coins?.slice(0, 7) || []) }
    } catch {} finally { setIsLoading(false) }
  }
  useEffect(() => { fetchData() }, [])
  const currentFear = fearGreed[0] ? parseInt(fearGreed[0].value) : null
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-secondary hover:bg-accent text-sm font-medium text-foreground transition-colors"><Bell className="w-4 h-4" /> Market Intel</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="flex items-center gap-2 text-foreground"><Activity className="w-5 h-5 text-primary" /> Market Intelligence</DialogTitle></DialogHeader>
        {isLoading && fearGreed.length === 0 ? (<div className="space-y-3 py-4">{Array.from({ length: 3 }).map((_, i) => (<div key={i} className="animate-pulse bg-muted rounded-lg h-20" />))}</div>) : (
          <div className="space-y-4">
            <Card className="bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all"><CardContent className="p-4"><h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Fear & Greed Index — 7 Days</h3><div className="space-y-2">{fearGreed.map((item, idx) => { const val = parseInt(item.value); const date = new Date(parseInt(item.timestamp) * 1000); const label = idx === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); return (<div key={idx} className="flex items-center gap-3"><span className="text-xs text-muted-foreground w-20 shrink-0">{label}</span><div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden"><div className={`h-full ${fearBg(val)} rounded-full transition-all`} style={{ width: `${val}%` }} /></div><span className={`text-sm font-bold w-8 text-right ${fearColor(val)}`}>{val}</span><span className="text-xs text-muted-foreground w-16">{item.value_classification}</span></div>) })}</div>{currentFear !== null && (<div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">{currentFear <= 25 ? '🔴 Extreme Fear — potential buying opportunity' : currentFear <= 45 ? '🟠 Fear — market is cautious' : currentFear <= 55 ? '🟡 Neutral — balanced sentiment' : currentFear <= 75 ? '🟢 Greed — market is optimistic' : '🟢 Extreme Greed — caution advised'}</div>)}</CardContent></Card>
            <Card className="bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all"><CardContent className="p-4"><h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Flame className="w-4 h-4 text-orange-400" /> Trending Now</h3><div className="space-y-2">{trending.map((t, idx) => (<div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"><img src={t.item.thumb} alt={t.item.name} className="w-7 h-7 rounded-full" loading="lazy" /><div className="flex-1 min-w-0"><div className="text-sm font-medium text-foreground">{t.item.name}<span className="text-muted-foreground ml-1.5">{t.item.symbol.toUpperCase()}</span></div></div>{t.item.data?.price !== undefined && (<span className="text-sm font-semibold text-foreground">${t.item.data.price < 1 ? t.item.data.price.toFixed(4) : t.item.data.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>)}{t.item.market_cap_rank && (<Badge variant="secondary" className="text-xs">#{t.item.market_cap_rank}</Badge>)}</div>))}</div></CardContent></Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function MarketTicker() {
  const [fearGreed, setFearGreed] = useState<FearGreedItem[]>([])
  useEffect(() => { fetch('/api/crypto/fear-greed').then(r => r.ok ? r.json() : null).then(d => { if (d?.data) setFearGreed(d.data) }).catch(() => {}) }, [])
  const current = fearGreed[0]
  if (!current) return null
  const val = parseInt(current.value)
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${val <= 25 ? 'bg-red-500/15 text-red-400' : val <= 45 ? 'bg-orange-500/15 text-orange-400' : val <= 55 ? 'bg-yellow-500/15 text-yellow-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
      <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'currentColor' }} />
      Fear & Greed: {val} — {current.value_classification}
    </div>
  )
}