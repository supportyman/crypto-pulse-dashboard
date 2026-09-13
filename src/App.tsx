import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Newspaper, BarChart3, Shield, Zap, Brain, Globe, TrendingUp, Calendar } from 'lucide-react'
import { CryptoNews } from '@/components/CryptoNews'
import { WeeklyPredictions } from '@/components/WeeklyPredictions'
import { CryptoPredictions } from '@/components/CryptoPredictions'
import { EventsPopup, MarketTicker } from '@/components/EventsPopup'
import { MarketRadar } from '@/components/MarketRadar'
import { EconomicCalendar } from '@/components/EconomicCalendar'

function AgentStatus() {
  const agents = [
    { name: 'News Collector', status: 'active' as const, icon: <Newspaper className="w-4 h-4" /> },
    { name: 'Market Analyst', status: 'active' as const, icon: <BarChart3 className="w-4 h-4" /> },
    { name: 'Sentiment Analyzer', status: 'active' as const, icon: <Globe className="w-4 h-4" /> },
    { name: 'Prediction Engine', status: 'active' as const, icon: <Brain className="w-4 h-4" /> },
    { name: 'Trend Tracker', status: 'active' as const, icon: <TrendingUp className="w-4 h-4" /> },
  ]

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6 px-4 py-3 rounded-xl bg-card/60 border border-border/40 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Zap className="w-4 h-4 text-primary" />
        Agent Team
      </div>
      <div className="h-4 w-px bg-border" />
      {agents.map(a => (
        <div key={a.name} className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          <span className="text-xs text-muted-foreground">{a.name}</span>
        </div>
      ))}
    </div>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState('markets')

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center border border-primary/20">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Crypto Pulse</h1>
              <p className="text-sm text-muted-foreground">AI-powered market intelligence & fundamental analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MarketTicker />
            <EventsPopup />
          </div>
          <div className="hidden lg:block -my-6">
            <MarketRadar />
          </div>
        </header>

        <AgentStatus />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-5 bg-secondary/60 backdrop-blur-sm">
            <TabsTrigger value="markets" className="gap-2 text-sm"><BarChart3 className="w-4 h-4" />Markets</TabsTrigger>
            <TabsTrigger value="predictions" className="gap-2 text-sm"><Brain className="w-4 h-4" />Predictions</TabsTrigger>
            <TabsTrigger value="news" className="gap-2 text-sm"><Newspaper className="w-4 h-4" />News</TabsTrigger>
            <TabsTrigger value="events" className="gap-2 text-sm"><Calendar className="w-4 h-4" />Events</TabsTrigger>
          </TabsList>
          <TabsContent value="markets" className="mt-0"><WeeklyPredictions /></TabsContent>
          <TabsContent value="predictions" className="mt-0"><CryptoPredictions /></TabsContent>
          <TabsContent value="news" className="mt-0"><CryptoNews /></TabsContent>
          <TabsContent value="events" className="mt-0"><EconomicCalendar /></TabsContent>
        </Tabs>

        <footer className="mt-10 pt-4 border-t border-border/50 text-center">
          <p className="text-xs text-muted-foreground">⚡ Powered by AI Agent Team • Live data from CoinPaprika, CoinTelegraph, CoinDesk, Decrypt & Investing.com • Not financial advice</p>
        </footer>
      </div>
    </div>
  )
}