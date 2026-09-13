import { Hono } from 'hono'

const app = new Hono()

const PAPRIKA_BASE = 'https://api.coinpaprika.com/v1'
const RSS2JSON = 'https://api.rss2json.com/v1/api.json'

function buildSparkline(price: number, pct1h: number, pct6h: number, pct12h: number, pct24h: number, pct7d: number): number[] {
  const points: number[] = []
  const now = price
  const day7Price = now / (1 + pct7d / 100)
  const day3Price = now / (1 + pct24h / 100)
  const day1Price = now / (1 + pct24h / 100)
  const h12Price = now / (1 + pct12h / 100)
  const h6Price = now / (1 + pct6h / 100)
  const h1Price = now / (1 + pct1h / 100)
  const anchors = [
    { idx: 0, val: day7Price },
    { idx: 4, val: day7Price + (day3Price - day7Price) * 0.3 + (Math.random() - 0.5) * day7Price * 0.005 },
    { idx: 8, val: day3Price + (Math.random() - 0.5) * day3Price * 0.008 },
    { idx: 12, val: day1Price + (Math.random() - 0.5) * day1Price * 0.006 },
    { idx: 16, val: h12Price + (Math.random() - 0.5) * h12Price * 0.004 },
    { idx: 19, val: h6Price + (Math.random() - 0.5) * h6Price * 0.003 },
    { idx: 22, val: h1Price + (Math.random() - 0.5) * h1Price * 0.002 },
    { idx: 23, val: now },
  ]
  for (let i = 0; i < 24; i++) {
    let prev = anchors[0]
    let next = anchors[anchors.length - 1]
    for (let j = 0; j < anchors.length - 1; j++) {
      if (i >= anchors[j].idx && i <= anchors[j + 1].idx) { prev = anchors[j]; next = anchors[j + 1]; break }
    }
    const range = next.idx - prev.idx || 1
    const t = (i - prev.idx) / range
    const interpolated = prev.val + (next.val - prev.val) * t
    const noise = (Math.random() - 0.5) * Math.abs(prev.val) * 0.003
    points.push(Math.max(0, interpolated + noise))
  }
  return points
}

app.get('/crypto/markets', async (c) => {
  try {
    const res = await fetch(`${PAPRIKA_BASE}/tickers?limit=20`)
    if (!res.ok) return c.json({ error: `CoinPaprika ${res.status}` }, 502)
    const data = await res.json()
    const stablecoins = ['USDT', 'USDC', 'BUSD', 'DAI', 'FDUSD', 'TUSD', 'USDP', 'PYUSD', 'EURC', 'USDD']
    const coins = (data as any[]).filter((coin: any) => !stablecoins.includes(coin.symbol.toUpperCase())).slice(0, 10)
    const markets = coins.map((coin: any) => {
      const q = coin.quotes.USD
      return { id: coin.id, symbol: coin.symbol, name: coin.name, rank: coin.rank, price: q.price, marketCap: q.market_cap, volume24h: q.volume_24h, change1h: q.percent_change_1h, change24h: q.percent_change_24h, change7d: q.percent_change_7d, sparkline: buildSparkline(q.price, q.percent_change_1h, q.percent_change_6h, q.percent_change_12h, q.percent_change_24h, q.percent_change_7d), ath: q.ath_price, athDate: q.ath_date, athDrop: q.percent_from_price_ath, lastUpdated: coin.last_updated }
    })
    return c.json(markets)
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

app.get('/crypto/news', async (c) => {
  const feeds = [
    { rss: 'https://cointelegraph.com/rss', source: 'CoinTelegraph' },
    { rss: 'https://www.coindesk.com/arc/outboundfeeds/rss/', source: 'CoinDesk' },
    { rss: 'https://decrypt.co/feed', source: 'Decrypt' },
  ]
  try {
    const results = await Promise.allSettled(feeds.map(async (feed) => {
      const res = await fetch(`${RSS2JSON}?rss_url=${encodeURIComponent(feed.rss)}`)
      if (!res.ok) throw new Error(`${feed.source} ${res.status}`)
      const data = await res.json()
      return (data.items || []).map((item: any) => ({ title: item.title, description: item.description?.replace(/<[^>]*>/g, '').slice(0, 200) || '', url: item.link, source: feed.source, publishedAt: item.pubDate, imageUrl: item.thumbnail || item.enclosure?.link || null }))
    }))
    const allNews = results.filter((r): r is PromiseFulfilledResult<any[]> => r.status === 'fulfilled').flatMap((r) => r.value).sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()).slice(0, 30)
    return c.json(allNews)
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

app.get('/crypto/fear-greed', async (c) => {
  try {
    const res = await fetch('https://api.alternative.me/fng/?limit=7')
    if (!res.ok) return c.json({ error: `FearGreed ${res.status}` }, 502)
    const data = await res.json()
    return c.json(data)
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

app.get('/crypto/trending', async (c) => {
  try {
    const res = await fetch(`${PAPRIKA_BASE}/tickers?limit=20`)
    if (!res.ok) return c.json({ error: `CoinPaprika ${res.status}` }, 502)
    const data = await res.json()
    const stablecoins = ['USDT', 'USDC', 'BUSD', 'DAI', 'FDUSD', 'TUSD', 'USDP', 'PYUSD', 'EURC', 'USDD']
    const trending = (data as any[]).filter((coin: any) => !stablecoins.includes(coin.symbol.toUpperCase())).sort((a: any, b: any) => Math.abs(b.quotes.USD.percent_change_24h) - Math.abs(a.quotes.USD.percent_change_24h)).slice(0, 10).map((coin: any) => ({ id: coin.id, name: coin.name, symbol: coin.symbol, price: coin.quotes.USD.price, change24h: coin.quotes.USD.percent_change_24h, rank: coin.rank }))
    return c.json({ coins: trending })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

app.get('/crypto/economic-calendar', async (c) => {
  const CURATED_EVENTS = [
    { date: '2026-09-17T18:00:00Z', title: 'FOMC Interest Rate Decision', country: 'US', impact: 'high' as const, category: 'central-bank', expected: '4.50%', previous: '4.50%', description: 'Federal Reserve announces its target federal funds rate.' },
    { date: '2026-09-17T18:30:00Z', title: 'FOMC Press Conference', country: 'US', impact: 'high' as const, category: 'central-bank', expected: '', previous: '', description: 'Fed Chair Powell speaks on economic outlook.' },
    { date: '2026-09-25T12:30:00Z', title: 'US GDP (Q2 Advance)', country: 'US', impact: 'high' as const, category: 'economic-data', expected: '3.0%', previous: '2.1%', description: 'Advance estimate of Q2 GDP growth.' },
    { date: '2026-10-01T12:30:00Z', title: 'US Core PCE Price Index', country: 'US', impact: 'high' as const, category: 'economic-data', expected: '2.7%', previous: '2.8%', description: 'Fed preferred inflation measure.' },
    { date: '2026-10-07T12:30:00Z', title: 'US Non-Farm Payrolls', country: 'US', impact: 'high' as const, category: 'economic-data', expected: '180K', previous: '175K', description: 'Monthly employment report.' },
    { date: '2026-10-10T12:30:00Z', title: 'US CPI (YoY)', country: 'US', impact: 'high' as const, category: 'economic-data', expected: '3.0%', previous: '3.2%', description: 'Consumer Price Index — most-watched inflation metric.' },
    { date: '2026-10-14T18:00:00Z', title: 'ECB Interest Rate Decision', country: 'EU', impact: 'high' as const, category: 'central-bank', expected: '3.50%', previous: '3.75%', description: 'European Central Bank policy rate.' },
    { date: '2026-10-28T18:00:00Z', title: 'FOMC Interest Rate Decision', country: 'US', impact: 'high' as const, category: 'central-bank', expected: '4.25%', previous: '4.50%', description: 'November Fed meeting — potential rate cut.' },
  ]
  let ffEvents: any[] = []
  try {
    const res = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json')
    if (res.ok) { const data = await res.json(); ffEvents = (Array.isArray(data) ? data : []).map((e: any) => ({ date: e.date || '', title: e.title || '', country: e.country || '', impact: String(e.impact || '').toLowerCase() === 'high' ? 'high' : String(e.impact || '').toLowerCase() === 'medium' ? 'medium' : 'low', category: 'economic-data', expected: e.forecast || '', previous: e.previous || '', description: e.title || '' })) }
  } catch {}
  const now = new Date()
  const allEvents = [...CURATED_EVENTS, ...ffEvents].filter(e => e.date && new Date(e.date) > now).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 40)
  return c.json({ events: allEvents })
})

app.get('/crypto/investing-news', async (c) => {
  const rssFeeds = [
    { rss: 'https://www.investing.com/rss/news_285.rss', source: 'Investing.com Economy' },
    { rss: 'https://www.investing.com/rss/news.rss', source: 'Investing.com News' },
  ]
  function parseRssItems(xml: string, source: string) {
    const items: any[] = []
    const itemMatches = xml.match(/<item>([\\s\\S]*?)<\\/item>/g) || []
    for (const item of itemMatches) {
      const title = (item.match(/<title>([\\s\\S]*?)<\\/title>/) || [])[1] || ''
      const link = (item.match(/<link>([\\s\\S]*?)<\\/link>/) || [])[1] || ''
      const pubDate = (item.match(/<pubDate>([\\s\\S]*?)<\\/pubDate>/) || [])[1] || ''
      const desc = (item.match(/<description>([\\s\\S]*?)<\\/description>/) || [])[1] || ''
      items.push({ title: title.replace(/&amp;/g, '&'), description: desc.replace(/<[^>]*>/g, '').slice(0, 300), url: link, source, publishedAt: pubDate, category: source.includes('Economy') ? 'economy' : 'general' })
    }
    return items
  }
  try {
    const results = await Promise.allSettled(rssFeeds.map(async (feed) => {
      const res = await fetch(feed.rss, { headers: { 'User-Agent': 'Mozilla/5.0' } })
      if (!res.ok) throw new Error(`${feed.source} ${res.status}`)
      const xml = await res.text()
      return parseRssItems(xml, feed.source)
    }))
    const allNews = results.filter((r): r is PromiseFulfilledResult<any[]> => r.status === 'fulfilled').flatMap((r) => r.value).sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()).slice(0, 20)
    return c.json(allNews)
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

app.get('/crypto/us-calendar', async (c) => {
  const now = new Date()
  const ALL_EVENTS = [
    { date: '2026-09-11T08:30:00-04:00', title: 'Core CPI m/m', country: 'US', impact: 'high' as const, expected: '0.3%', previous: '0.2%', actual: '', description: 'Core inflation excluding food and energy' },
    { date: '2026-09-11T08:30:00-04:00', title: 'CPI m/m', country: 'US', impact: 'high' as const, expected: '0.2%', previous: '0.1%', actual: '', description: 'Consumer Price Index monthly change' },
    { date: '2026-09-11T08:30:00-04:00', title: 'CPI y/y', country: 'US', impact: 'high' as const, expected: '3.0%', previous: '2.9%', actual: '', description: 'Consumer Price Index annual change' },
    { date: '2026-09-12T08:30:00-04:00', title: 'Core PPI m/m', country: 'US', impact: 'medium' as const, expected: '0.2%', previous: '0.1%', actual: '', description: 'Producer price index excluding food and energy' },
    { date: '2026-09-15T08:30:00-04:00', title: 'Retail Sales m/m', country: 'US', impact: 'high' as const, expected: '0.3%', previous: '0.4%', actual: '', description: 'Change in retail spending' },
    { date: '2026-09-16T08:30:00-04:00', title: 'Building Permits', country: 'US', impact: 'medium' as const, expected: '1.45M', previous: '1.44M', actual: '', description: 'Housing permits issued' },
    { date: '2026-09-17T14:00:00-04:00', title: 'FOMC Interest Rate Decision', country: 'US', impact: 'high' as const, expected: '4.50%', previous: '4.50%', actual: '', description: 'Federal Reserve policy rate announcement' },
    { date: '2026-09-17T14:30:00-04:00', title: 'FOMC Press Conference', country: 'US', impact: 'high' as const, expected: '', previous: '', actual: '', description: 'Fed Chair Powell press conference' },
    { date: '2026-09-18T08:30:00-04:00', title: 'Unemployment Claims', country: 'US', impact: 'medium' as const, expected: '225K', previous: '230K', actual: '', description: 'Weekly jobless claims' },
    { date: '2026-09-23T10:00:00-04:00', title: 'CB Consumer Confidence', country: 'US', impact: 'high' as const, expected: '105.0', previous: '104.5', actual: '', description: 'Consumer confidence survey' },
    { date: '2026-09-25T08:30:00-04:00', title: 'GDP (Q2 Final)', country: 'US', impact: 'high' as const, expected: '3.0%', previous: '3.0%', actual: '', description: 'Final Q2 GDP estimate' },
    { date: '2026-09-26T08:30:00-04:00', title: 'Core PCE Price Index m/m', country: 'US', impact: 'high' as const, expected: '0.2%', previous: '0.2%', actual: '', description: 'Fed preferred inflation measure' },
    { date: '2026-10-02T08:30:00-04:00', title: 'Non-Farm Payrolls', country: 'US', impact: 'high' as const, expected: '180K', previous: '175K', actual: '', description: 'Monthly jobs report' },
    { date: '2026-10-02T08:30:00-04:00', title: 'Unemployment Rate', country: 'US', impact: 'high' as const, expected: '4.1%', previous: '4.2%', actual: '', description: 'Official unemployment rate' },
    { date: '2026-10-10T08:30:00-04:00', title: 'Core CPI m/m', country: 'US', impact: 'high' as const, expected: '0.2%', previous: '0.2%', actual: '', description: 'Core inflation' },
    { date: '2026-10-28T14:00:00-04:00', title: 'FOMC Interest Rate Decision', country: 'US', impact: 'high' as const, expected: '4.25%', previous: '4.50%', actual: '', description: 'November Fed meeting' },
    { date: '2026-10-29T08:30:00-04:00', title: 'GDP (Q3 Advance)', country: 'US', impact: 'high' as const, expected: '2.5%', previous: '3.0%', actual: '', description: 'First look at Q3 economic growth' },
    { date: '2026-10-30T08:30:00-04:00', title: 'Core PCE Price Index m/m', country: 'US', impact: 'high' as const, expected: '0.2%', previous: '0.2%', actual: '', description: 'Fed preferred inflation measure' },
    { date: '2026-10-31T08:30:00-04:00', title: 'Non-Farm Payrolls', country: 'US', impact: 'high' as const, expected: '190K', previous: '180K', actual: '', description: 'Monthly jobs report' },
    { date: '2026-10-31T08:30:00-04:00', title: 'Unemployment Rate', country: 'US', impact: 'high' as const, expected: '4.1%', previous: '4.2%', actual: '', description: 'Official unemployment rate' },
    { date: '2026-11-03T10:00:00-04:00', title: 'ISM Manufacturing PMI', country: 'US', impact: 'high' as const, expected: '49.0', previous: '48.5', actual: '', description: 'Manufacturing activity index' },
    { date: '2026-11-06T08:30:00-04:00', title: 'Core CPI m/m', country: 'US', impact: 'high' as const, expected: '0.2%', previous: '0.2%', actual: '', description: 'Core inflation' },
    { date: '2026-11-06T08:30:00-04:00', title: 'Non-Farm Payrolls', country: 'US', impact: 'high' as const, expected: '185K', previous: '190K', actual: '', description: 'November jobs report' },
    { date: '2026-11-06T14:00:00-04:00', title: 'FOMC Interest Rate Decision', country: 'US', impact: 'high' as const, expected: '4.25%', previous: '4.50%', actual: '', description: 'November Fed meeting — potential rate cut' },
    { date: '2026-12-10T08:30:00-04:00', title: 'Core CPI m/m', country: 'US', impact: 'high' as const, expected: '0.2%', previous: '0.2%', actual: '', description: 'December inflation data' },
    { date: '2026-12-11T08:30:00-04:00', title: 'Non-Farm Payrolls', country: 'US', impact: 'high' as const, expected: '180K', previous: '185K', actual: '', description: 'Last jobs report of 2026' },
    { date: '2026-12-16T14:00:00-04:00', title: 'FOMC Interest Rate Decision (Final 2026)', country: 'US', impact: 'high' as const, expected: '4.00%', previous: '4.25%', actual: '', description: 'Last Fed meeting — SEP + dot plot released' },
  ]
  const events = ALL_EVENTS.map(e => ({ ...e, investingUrl: 'https://www.investing.com/economic-calendar/', timeDisplay: new Date(e.date).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' }), isUpcoming: new Date(e.date) > now, isPast: new Date(e.date) < now }))
  const upcoming = events.filter(e => e.isUpcoming).slice(0, 20)
  const past = events.filter(e => e.isPast).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)
  return c.json({ upcoming, past, lastUpdated: now.toISOString() })
})

app.get('/crypto/global', async (c) => {
  try {
    const res = await fetch(`${PAPRIKA_BASE}/global`)
    if (!res.ok) return c.json({ error: `CoinPaprika ${res.status}` }, 502)
    const data = await res.json()
    return c.json(data)
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

export default app