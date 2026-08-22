import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, RefreshCw, Clock, Newspaper } from 'lucide-react'

interface NewsItem {
  title: string
  description: string
  url: string
  source: string
  publishedAt: string
  imageUrl?: string
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const sourceColors: Record<string, string> = {
  CoinTelegraph: 'bg-blue-600 text-white',
  CoinDesk: 'bg-purple-600 text-white',
  Decrypt: 'bg-orange-500 text-white',
}

export function CryptoNews() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const sources = ['all', 'CoinTelegraph', 'CoinDesk', 'Decrypt']

  const fetchNews = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/crypto/news')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setNews(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNews()
    const interval = setInterval(fetchNews, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const filtered = filter === 'all' ? news : news.filter(n => n.source === filter)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-primary" /> Live Crypto News
        </h2>
        <Button variant="ghost" size="sm" onClick={fetchNews} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>
      <div className="flex gap-2">
        {sources.map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filter === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent'}`}>
            {s === 'all' ? 'All Sources' : s}
          </button>
        ))}
      </div>
      {error && (
        <Card className="border-destructive/50 bg-destructive/10"><CardContent className="p-3 text-sm text-destructive">Failed to load news: {error}</CardContent></Card>
      )}
      {isLoading && news.length === 0 && (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => (<div key={i} className="animate-pulse bg-card rounded-lg p-4 space-y-2"><div className="h-4 bg-muted rounded w-3/4" /><div className="h-3 bg-muted rounded w-1/2" /></div>))}</div>
      )}
      <div className="space-y-2">
        {filtered.map((item, idx) => (
          <a key={idx} href={item.url} target="_blank" rel="noopener noreferrer" className="block group">
            <Card className="bg-card/80 backdrop-blur-sm hover:border-primary/30 hover:bg-accent/30 border-border/50 transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-primary/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge className={`${sourceColors[item.source] || 'bg-secondary'} text-xs`}>{item.source}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(item.publishedAt)}</span>
                    </div>
                    <h3 className="font-semibold text-foreground text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">{item.title}</h3>
                    {item.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.description}</p>}
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
      {!isLoading && filtered.length === 0 && !error && <div className="text-center py-8 text-muted-foreground text-sm">No news articles found</div>}
    </div>
  )
}