# Project Overview: HPL Rural Market Prototype

## What is this project?

A **rural agricultural commodity price finder** for Indian farmers and traders. It helps users discover the best mandi (market) to sell their produce by comparing real-time prices, transport costs, and net revenue across 196 markets in 9 states.

## Core Problem It Solves

Farmers often sell at their nearest mandi without knowing that another market a few dozen kilometers away might offer significantly better prices after accounting for transport. This tool surfaces that **geospatial arbitrage** — the price difference between markets — so farmers can make informed decisions about where to sell.

## Key Features

### 1. Price Discovery
- Browse modal prices (Rs./kg) for ~90 agricultural commodities across all tracked markets.
- Filter by state and commodity. Quick-access presets for common crops (tomato, onion, potato, brinjal).

### 2. Interactive Map (Leaflet)
- Full-page map with price-colored markers for every mandi reporting a selected commodity.
- Click a market to see its price, distance from the user's origin, transport cost, and net revenue.
- Compare two markets side-by-side with a visual panel. Route lines are drawn on the map using real road routing.

### 3. Net Revenue Recommendation
- The backend ranks every market by **net revenue** = modal price - transport cost.
- Provides a "recommended" mandi with a plain-English explanation of why it wins (higher price, lower transport, etc.).
- Uses Haversine distance * a configurable per-km transport rate to estimate transport cost.

### 4. Price History & Trends
- Synthetic daily price history (anchored on real modal prices) for any commodity-market pair.
- Line charts show 30-day (configurable up to 90) price trends.

### 5. Basket Analysis
- A POST `/api/analyze` endpoint lets users submit a basket of multiple commodities with quantities.
- Ranks markets by total basket net revenue, handling partial availability (markets missing some items).

### 6. Bilingual UI (English / Hindi)
- Toggle between English and Hindi across the entire interface — commodity names, market labels, UI text.

## Architecture

```
backend/                 Express + TypeScript API (port 4000)
  src/
    index.ts             Server entry, mounts router
    routes.ts            All API endpoints (states, markets, prices, compare, recommend, analyze)
    store.ts             In-memory data store loaded from JSON files
    geo.ts               Haversine distance calculation
    basket.ts            Multi-commodity basket analysis
    config.ts            Transport rate, default days, etc.
  data/
    markets.json         196 markets with lat/lng coordinates
    commodities.json     ~90 commodities with English + Hindi names
    prices.json          Latest price per market-commodity pair
    history.json         Synthetic daily price history
  csv/                   Raw Agmarknet CSV + formatted JSON
  scripts/               format-csv.ts, generate-data.ts (build dataset from CSV)

frontend/                React 19 + Vite + Tailwind CSS (port 3000)
  src/
    App.tsx              Router: Dashboard (/) and Map (/map)
    pages/
      DashboardPage.tsx  Price table, charts, search, presets
      MapPage.tsx        Leaflet map, market selection, compare panel, routing
    components/
      TopNav.tsx         Navigation bar with language toggle
      map/               Map-specific components (FlyTo, ComparePanel, PriceTrend, etc.)
      advance/           Advance search modal
    api/
      client.ts          Fetch helpers for all backend endpoints
      routing.ts         OSRM-based road routing
      types.ts           Shared TypeScript types
    utils/               Formatting utilities
```

## Data Pipeline

1. Raw Agmarknet CSV (marketwise daily report) is placed in `backend/csv/`.
2. `npm run format-csv` normalizes the CSV into `formated.json`.
3. `npm run generate` processes `formated.json` into the runtime JSON files in `backend/data/`.
4. The Express server loads these JSON files into memory at startup.

## API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/states` | GET | List all states |
| `/api/markets` | GET | Markets, filterable by state |
| `/api/commodities` | GET | All commodities |
| `/api/prices` | GET | Prices for a commodity, optional market/state filter |
| `/api/prices/latest` | GET | Latest price for every market reporting a commodity |
| `/api/prices/history` | GET | Daily price history for a commodity-market pair |
| `/api/compare` | GET | Side-by-side comparison of two markets |
| `/api/recommend` | GET | Best market for a commodity given an origin |
| `/api/analyze` | POST | Best market for a multi-commodity basket |

## Data Source

Prices come from the **Agmarknet** marketwise report (Government of India). The prototype currently uses a snapshot from 2026-09-06. Prices are reported in Rs./quintal and converted to Rs./kg throughout the app. Daily trends are synthetic estimates anchored on real modal prices.
