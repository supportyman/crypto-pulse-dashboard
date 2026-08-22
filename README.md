# 🚀 Crypto Pulse Dashboard

AI-powered crypto market intelligence & fundamental analysis dashboard.

## Features

- **📊 Live Markets** — Top 10 cryptos by market cap with real-time prices, 24h/7d changes, sparkline charts
- **🧠 Price Predictions** — Weekly upside/downside targets with confidence scores and reasoning
- **📰 Live News** — Aggregated crypto news from CoinTelegraph, CoinDesk & Decrypt
- **📈 Market Intel** — Fear & Greed Index (7-day), Trending coins
- **📡 Market Radar** — Holographic animated radar scanning the market
- **🤖 Agent Team** — 5 AI agents working together (News Collector, Market Analyst, Sentiment Analyzer, Prediction Engine, Trend Tracker)

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS v4 + shadcn/ui
- Recharts for data visualization
- Hono backend (custom-routes.ts)
- CoinGecko API, RSS feeds, Fear & Greed API

## Getting Started

```bash
bun install
bun run dev
```

## API Routes

All defined in `custom-routes.ts`:

| Route | Description |
|-------|-------------|
| `/api/crypto/markets` | Top 10 coins by market cap (CoinGecko) |
| `/api/crypto/news` | Live news from 3 RSS sources |
| `/api/crypto/fear-greed` | Fear & Greed Index (7 days) |
| `/api/crypto/trending` | Trending coins |
| `/api/crypto/chart/:id` | 7-day chart for a specific coin |

## Disclaimer

Not financial advice. All predictions are AI-generated estimates based on technical indicators.