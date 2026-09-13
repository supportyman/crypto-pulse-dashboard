import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Bell, Flame, Activity } from 'lucide-react'

interface FearGreedItem { value: string; value_classification: string; timestamp: string }
interface TrendingCoin { id: string; name: string; symbol: string; price: number; change24h: number; rank: number }

export function EventsPopup() {
  const [fearGreed, setFearGreed] = useState<FearGreedItem[]>([])
  const [trending, setTrending] = useState<TrendingCoin[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => { setLoading(true); try { const [fgRes, trRes] = await Promise.allSettled([fetch('/api/crypto/fear-greed').then(r => r.ok ? r.json() : { data: [] }), fetch('/api/crypto/trending').then(r => r.ok ? r.json() : { coins: [] })]); if (fgRes.status === 'fulfilled') setFearGreed(fgRes.value.data || []); if (trRes.status === 'fulfilled') setTrending(trRes.value.coins || []) } catch {} finally { setLoading(false) } }
  useEffect(() => { fetchData() }, [])
  return (
    <Dialog><DialogTrigger asChild><button className="relative inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card/80 border border-border/50 hover:border-primary/30 transition-all text-sm"><Bell className="w-4 h-4 text-primary" /><span className="hidden sm:inline text-foreground font-medium">Market Intel</span>{fearGreed.length > 0 && (<Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border border-primary/20">{fearGreed[0].value}</Badge>)}</button></DialogTrigger><DialogContent className="bg-card/95 backdrop-blur-xl border-border/50 max-w-lg"><DialogHeader><DialogTitle className="flex items-center gap-2 text-foreground"><Flame className="w-5 h-5 text-primary" />Market Intelligence</DialogTitle></DialogHeader><div className="space-y-4">
      <div><h4 className="text-sm font-semibold text-foreground mb-2">Fear & Greed Index (7 Days)</h4><div className="space-y-2">{fearGreed.map((fg, i) => { const val = parseInt(fg.value); const color = val >= 75 ? 'text-emerald-400' : val >= 50 ? 'text-yellow-400' : val >= 25 ? 'text-orange-400' : 'text-red-400'; return (<div key={i} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50"><span className="text-xs text-muted-foreground">{new Date(fg.timestamp * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span><div className="flex items-center gap-2"><Badge variant="secondary" className={`text-xs ${color}`}>{fg.value}</Badge><span className="text-xs text-muted-foreground">{fg.value_classification}</span></div></div>)})}</div></div>
      <div><h4 className="text-sm font-semibold text-foreground mb-2">Top Trending Coins</h4><div className="space-y-1.5">{trending.slice(0, 7).map((coin) => (<div key={coin.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50"><div className="flex items-center gap-2"><Activity className="w-3 h-3 text-primary" /><span className="text-xs font-medium text-foreground">{coin.symbol.toUpperCase()}</span><span className="text-xs text-muted-foreground">{coin.name}</span></div><div className="text-right"><span className="text-xs font-medium text-foreground">${coin.price?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span><span className={`text-[10px] ml-2 ${coin.change24h > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{coin.change24h > 0 ? '+' : ''}{coin.change24h?.toFixed(2)}%</span></div></div>))}</div></div>
      {loading && (<div className="text-xs text-muted-foreground text-center py-2">Loading...</div>)}</div></DialogContent></Dialog>
  )
}

export function MarketTicker() {
  const [fearGreed, setFearGreed] = useState<FearGreedItem | null>(null)
  useEffect(() => { fetch('/api/crypto/fear-greed').then(r => r.ok ? r.json() : { data: [] }).then(d => { if (d.data?.length) setFearGreed(d.data[0]) }).catch(() => {}) }, [])
  if (!fearGreed) return null
  const val = parseInt(fearGreed.value)
  const color = val >= 75 ? 'text-emerald-400' : val >= 50 ? 'text-yellow-400' : val >= 25 ? 'text-orange-400' : 'text-red-400'
  return (<div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card/80 border border-border/50"><Flame className="w-4 h-4 text-primary" /><span className="text-xs text-muted-foreground">F&G</span><span className={`text-sm font-bold ${color}`}>{fearGreed.value}</span><span className="text-[10px] text-muted-foreground">{fearGreed.value_classification}</span></div>)
}