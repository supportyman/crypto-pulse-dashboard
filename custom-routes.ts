import { Hono } from 'hono'

const app = new Hono()

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3'
const RSS2JSON = 'https://api.rss2json.com/v1/api.json'

// Live market data for top coins with sparklines
app.get('/crypto/markets', async (c) => {
  try {
    const res = await fetch(
      `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=true&price_change_percentage=1h,24h,7d`
    )
    if (!res.ok) return c.json({ error: `CoinGecko ${res.status}` }, 502)
    const data = await res.json()
    return c.json(data)
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// 7-day chart data for a single coin
app.get('/crypto/chart/:id', async (c) => {
  const id = c.req.param('id')
  try {
    const res = await fetch(
      `${COINGECKO_BASE}/coins/${id}/market_chart?vs_currency=usd&days=7&interval=daily`
    )
    if (!res.ok) return c.json({ error: `CoinGecko ${res.status}` }, 502)
    const data = await res.json()
    return c.json(data)
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// Live crypto news from multiple RSS feeds
app.get('/crypto/news', async (c) => {
  const feeds = [
    { rss: 'https://cointelegraph.com/rss', source: 'CoinTelegraph' },
    { rss: 'https://www.coindesk.com/arc/outboundfeeds/rss/', source: 'CoinDesk' },
    { rss: 'https://decrypt.co/feed', source: 'Decrypt' },
  ]

  try {
    const results = await Promise.allSettled(
      feeds.map(async (feed) => {
        const res = await fetch(`${RSS2JSON}?rss_url=${encodeURIComponent(feed.rss)}`)
        if (!res.ok) throw new Error(`${feed.source} ${res.status}`)
        const data = await res.json()
        return (data.items || []).map((item: any) => ({
          title: item.title,
          description: item.description?.replace(/<[^>]*>/g, '').slice(0, 200) || '',
          url: item.link,
          source: feed.source,
          publishedAt: item.pubDate,
          imageUrl: item.thumbnail || item.enclosure?.link || null,
        }))
      })
    )

    const allNews = results
      .filter((r): r is PromiseFulfilledResult<any[]> => r.status === 'fulfilled')
      .flatMap((r) => r.value)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 30)

    return c.json(allNews)
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// Fear & Greed Index (7 days)
app.get('/crypto/fear-greed', async (c) => {
  try {
    const res = await fetch('https://api.alternative.me/fng/?limit=7')
    if (!res.ok) return c.json({ error: `FearGreed ${res.status}` }, 502)
    const data = await res.json()
    return c.json(data)
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// Trending coins
app.get('/crypto/trending', async (c) => {
  try {
    const res = await fetch(`${COINGECKO_BASE}/search/trending`)
    if (!res.ok) return c.json({ error: `CoinGecko ${res.status}` }, 502)
    const data = await res.json()
    return c.json(data)
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// Global market data
app.get('/crypto/global', async (c) => {
  try {
    const res = await fetch(`${COINGECKO_BASE}/global`)
    if (!res.ok) return c.json({ error: `CoinGecko ${res.status}` }, 502)
    const data = await res.json()
    return c.json(data)
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

export default app