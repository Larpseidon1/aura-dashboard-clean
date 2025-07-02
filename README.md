# Aura Dashboard - Clean Implementation

A comprehensive crypto infrastructure dashboard featuring real-time Aura Score calculations, annualized revenue metrics, FDV tracking, and return analysis.

## Features

### 🎯 Core Features
- **Aura Score Calculation**: Advanced algorithm comparing annualized revenue to amount raised
- **Revenue (Annualized)**: Real-time data from DeFiLlama and Hyperliquid APIs
- **Ecosystem Revenue**: L1/L2 ecosystem app fees tracking
- **FDV (Fully Diluted Valuation)**: Multi-source approach for comprehensive coverage
- **Return Analysis**:
  - Return vs Previous Funding Round
  - Return vs TGE (Token Generation Event)
- **Mobile Optimization**: Responsive design for all devices
- **Vercel Optimization**: Efficient caching and API rate limiting

### 📊 Data Sources
- **DeFiLlama**: Protocol and chain revenue data (primary source)
- **Hyperliquid**: Builder revenue from perpetual trading
- **CoinMarketCap**: FDV and price data (optional, improves coverage)
- **CoinGecko**: Fallback for critical tokens

## FDV Data Coverage

The dashboard uses a multi-source approach to maximize FDV data coverage:

1. **DeFiLlama** (Default): Fast, no rate limits, good coverage for major tokens
2. **CoinMarketCap** (Optional): Best FDV coverage, requires free API key
3. **CoinGecko** (Fallback): Limited to 5 critical tokens due to rate limits

### Improving FDV Coverage

To get the best FDV data coverage:

1. Sign up for a free CoinMarketCap API key at https://pro.coinmarketcap.com/signup
2. Copy `env.example` to `.env.local`
3. Add your API key:
   ```
   COINMARKETCAP_API_KEY=your_api_key_here
   ```

The free tier includes 10,000 calls/month which is more than sufficient.

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Environment Variables

Copy `env.example` to `.env.local` and configure:

- `COINMARKETCAP_API_KEY`: (Optional) For better FDV coverage
- `CUSTOM_KEY`: (Optional) For custom Hyperliquid endpoints

## API Endpoints

- `/api/comparison`: Infrastructure comparison data with Aura scores
- `/api/builders/revenue`: Hyperliquid builder revenue data
- `/api/builders/discover`: Builder discovery and analytics

## Key Metrics

### Aura Score Algorithm
- **Bootstrapped Projects**: Infinity score if revenue positive
- **Funded Projects**: Logarithmic scale based on revenue/funding ratio
- **Minimum Score**: 0 (loss-making projects)

### Revenue Calculation
- **30-day Revenue × 12**: Standard annualization methodology
- **Ecosystem Revenue**: 70% weight for app fees on L1/L2s
- **Builder Revenue**: Direct + estimated referral fees

## Performance Optimizations

- **Caching**: 5-minute cache for API responses
- **Parallel Fetching**: All data sources fetched concurrently
- **Progressive Loading**: UI renders with partial data
- **Rate Limit Protection**: Automatic fallbacks and retries

## Deployment

Optimized for Vercel deployment:

```bash
vercel
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first. 