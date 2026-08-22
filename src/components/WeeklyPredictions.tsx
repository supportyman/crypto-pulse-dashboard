import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, Minus, RefreshCw, BarChart3 } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'

interface MarketCoin {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  market_cap_rank: number
  price_change_percentage_24h: number
  price_change_percentage_7d_in_currency: number
  sparkline_in_7d: { price: number[] }
  high_24h: number
  low_24h: number
  total_volume: number
  market_cap: number
}

function formatPrice(price: number): string {
  if (price >= 1) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  return `$${price.toFixed(4)}`
}

function formatLargeNum(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  return `$${n.toLocaleString()}`
}

export function WeeklyPredictions() {
  const [coins, setCoins] = useState<MarketCoin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/crypto/markets')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setCoins(data)
    } catch (e: any) { setError(e.message) } finally { setIsLoading(false) }
  }
  useEffect(() => { fetchData(); const i = setInterval(fetchData, 60000); return () => clearInterval(i) }, [])
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> Top 10 by Market Cap <Badge variant="secondary" className="text-xs font-normal ml-1">LIVE</Badge></h2>
        <Button variant="ghost" size="sm" onClick={fetchData} disabled={isLoading}><RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh</Button>
      </div>
      {error && <Card className="border-destructive/50 bg-destructive/10"><CardContent className="p-3 text-sm text-destructive">Failed to load market data: {error}</CardContent></Card>}
      {isLoading && coins.length === 0 && <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => (<div key={i} className="animate-pulse bg-card rounded-lg p-4 flex items-center gap-4"><div className="h-10 w-10 bg-muted rounded-full" /><div className="flex-1 space-y-2"><div className="h-4 bg-muted rounded w-1/4" /><div className="h-3 bg-muted rounded w-1/6" /></div><div className="h-12 w-24 bg-muted rounded" /></div>))}</div>}
      <div className="space-y-2">
        {coins.map((coin) => {
          const change24h = coin.price_change_percentage_24h ?? 0
          const change7d = coin.price_change_percentage_7d_in_currency ?? 0
          const trend24h = change24h > 0 ? 'up' : change24h < 0 ? 'down' : 'flat'
          const trend7d = change7d > 0 ? 'up' : change7d < 0 ? 'down' : 'flat'
          const sparkData = (coin.sparkline_in_7d?.price || []).map((p, i) => ({ v: p, i }))
          return (
            <Card key={coin.id} className="bg-card/80 backdrop-blur-sm border-border/40 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 w-40 shrink-0"><span className="text-xs font-bold text-muted-foreground w-5 text-right">{coin.market_cap_rank}</span><img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" loading="lazy" /><div><div className="font-semibold text-sm text-foreground">{coin.symbol.toUpperCase()}</div><div className="text-xs text-muted-foreground">{coin.name}</div></div></div>
                  <div className="grid grid-cols-3 gap-6 flex-1">
                    <div><div className="text-xs text-muted-foreground mb-0.5">Price</div><div className="font-bold text-foreground">{formatPrice(coin.current_price)}</div></div>
                    <div><div className="text-xs text-muted-foreground mb-0.5">24h</div><div className={`font-semibold flex items-center gap-1 text-sm ${trend24h === 'up' ? 'text-emerald-400' : trend24h === 'down' ? 'text-red-400' : 'text-muted-foreground'}`}>{trend24h === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : trend24h === 'down' ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}{change24h > 0 ? '+' : ''}{change24h.toFixed(2)}%</div></div>
                    <div><div className="text-xs text-muted-foreground mb-0.5">7d</div><div className={`font-semibold flex items-center gap-1 text-sm ${trend7d === 'up' ? 'text-emerald-400' : trend7d === 'down' ? 'text-red-400' : 'text-muted-foreground'}`}>{trend7d === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : trend7d === 'down' ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}{change7d > 0 ? '+' : ''}{change7d.toFixed(2)}%</div></div>
                  </div>
                  <div className="w-32 h-12 shrink-0">{sparkData.length > 0 && (<ResponsiveContainer width="100%" height="100%"><AreaChart data={sparkData}><defs><linearGradient id={`grad-${coin.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={trend7d === 'up' ? '#10b981' : trend7d === 'down' ? '#ef4444' : '#6b7280'} stopOpacity={0.3} /><stop offset="100%" stopColor={trend7d === 'up' ? '#10b981' : trend7d === 'down' ? '#ef4444' : '#6b7280'} stopOpacity={0} /></linearGradient></defs><Area type="monotone" dataKey="v" stroke={trend7d === 'up' ? '#10b981' : trend7d === 'down' ? '#ef4444' : '#6b7280'} strokeWidth={1.5} fill={`url(#grad-${coin.id})`} dot={false} /><Tooltip contentStyle={{ backgroundColor: 'oklch(0.16 0.012 260)', border: '1px solid oklch(0.28 0.015 260)', borderRadius: '8px', fontSize: '12px' }} formatter={(value: number) => [formatPrice(value), 'Price']} labelFormatter={() => ''} /></AreaChart></ResponsiveContainer>)}</div>
                  <div className="text-right w-24 shrink-0"><div className="text-xs text-muted-foreground">Mkt Cap</div><div className="text-sm font-medium text-foreground">{formatLargeNum(coin.market_cap)}</div></div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      {!isLoading && coins.length === 0 && !error && <div className="text-center py-8 text-muted-foreground text-sm">No market data available</div>}
    </div>
  )
}