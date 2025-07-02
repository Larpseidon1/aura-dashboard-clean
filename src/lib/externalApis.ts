import { CryptoProject } from '@/types';
import { HyperliquidAPI } from './hyperliquidApi';

// DeFiLlama API
const DEFILLAMA_BASE_URL = 'https://api.llama.fi';

// Rate limiting helper
let lastRequestTime = 0;
const RATE_LIMIT_DELAY = 1000; // 1 second between requests to avoid rate limiting

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
  return fetch(url);
}

// Updated ecosystem chain mappings based on spreadsheet column F
// Only include projects that have actual ecosystem revenue links (not "-")
const ECOSYSTEM_CHAIN_MAPPINGS: Record<string, string> = {
  'Hyperliquid': 'hyperliquid-l1',  // Has ecosystem apps
  'Berachain': 'berachain',        // Has ecosystem apps  
  'Blast': 'blast',                // Has ecosystem apps
  'Sonic': 'sonic',                // Has ecosystem apps
  'Optimism': 'op-mainnet',        // Has ecosystem apps
  'Arbitrum': 'arbitrum',          // Has ecosystem apps
  'Solana': 'solana',              // Has ecosystem apps
  'Ethereum': 'ethereum',          // Has ecosystem apps
  'Movement': 'movement',          // Has ecosystem apps
  'Sui Network': 'sui',            // Has ecosystem apps
  'Initia': 'initia',              // Has ecosystem apps
  'Tron': 'tron',                  // Has ecosystem apps
  'Polygon': 'polygon',            // Has ecosystem apps
  'Ton': 'ton'                     // Has ecosystem apps
  // Note: Celestia and Story Protocol are excluded - they show "-" in spreadsheet
};

// Projects that definitely do NOT have ecosystem revenue (marked with "-" in spreadsheet)
const NO_ECOSYSTEM_PROJECTS = ['Celestia', 'Story Protocol'];

// Simplified project mapping for DeFiLlama chain slugs (for protocol revenue)
const CHAIN_MAPPINGS: Record<string, string> = {
  'Hyperliquid': 'hyperliquid',
  'Berachain': 'berachain',
  'Blast': 'blast',
  'Sonic': 'sonic',
  'Celestia': 'celestia',
  'Optimism': 'op-mainnet',
  'Arbitrum': 'arbitrum',
  'Solana': 'solana',
  'Ethereum': 'ethereum',
  'Story Protocol': 'story',
  'Movement': 'movement',
  'Sui Network': 'sui',
  'Initia': 'initia',
  'Tron': 'tron',
  'Polygon': 'polygon',
  'Ton': 'ton'
};

// App mappings for DeFiLlama protocol slugs
const APP_MAPPINGS: Record<string, string> = {
  'Axiom': 'axiom',
  'Moonshot': 'moonshot.money',
  'Tether': 'tether',
  'Circle': 'circle',
  'Pump.fun': 'pump.fun',
  'Phantom': 'phantom'
};

async function fetchHyperliquidBuilderRevenue(builderAddress: string): Promise<number> {
  try {
    console.log(`🔄 Fetching Hyperliquid builder revenue for ${builderAddress}...`);
    
    const api = new HyperliquidAPI();
    const annualizedData = await api.getAnnualizedBuilderRevenue(builderAddress);
    
    // Use properly calculated annualized revenue based on recent activity
    const annualizedRevenue = annualizedData.annualizedRevenue;
    
    console.log(`✅ ${builderAddress}: $${annualizedRevenue.toLocaleString()} annualized builder revenue (${annualizedData.dataSource})`);
    console.log(`📊 ${builderAddress}: $${annualizedData.totalCumulative.toLocaleString()} total cumulative vs $${annualizedRevenue.toLocaleString()} annualized`);
    
    if (annualizedData.breakdown.tradingFees30d > 0) {
      console.log(`💎 ${builderAddress}: Trading: $${annualizedData.breakdown.tradingFees30d.toFixed(2)}, Referral: $${annualizedData.breakdown.estimatedReferralFees30d.toFixed(2)} (30d breakdown)`);
    }
    
    return annualizedRevenue;
  } catch (error) {
    console.error(`❌ Error fetching Hyperliquid builder revenue for ${builderAddress}:`, error);
    return 0;
  }
}

async function fetchAppProtocolRevenue(protocolName: string): Promise<number> {
  try {
    // Special handling for Pump.fun - aggregate from both pump.fun and pumpswap
    if (protocolName === 'Pump.fun') {
      console.log(`🚀 Special handling for Pump.fun - fetching from both pump.fun and pumpswap`);
      
      const [pumpData, pumpswapData] = await Promise.all([
        fetch(`https://api.llama.fi/summary/fees/pump.fun`).then(res => res.json()),
        fetch(`https://api.llama.fi/summary/fees/pumpswap`).then(res => res.json())
      ]);
      
      // Use 30d data if available, fallback to 7d×52, then 24h×365
      let pumpRevenue = 0;
      let pumpswapRevenue = 0;
      let methodology = '';
      
      if (pumpData.total30d && pumpswapData.total30d) {
        pumpRevenue = (pumpData.total30d || 0) * 12;
        pumpswapRevenue = (pumpswapData.total30d || 0) * 12;
        methodology = '30d total × 12';
      } else if (pumpData.total7d && pumpswapData.total7d) {
        pumpRevenue = (pumpData.total7d || 0) * 52;
        pumpswapRevenue = (pumpswapData.total7d || 0) * 52;
        methodology = '7d total × 52';
      } else if (pumpData.total24h && pumpswapData.total24h) {
        pumpRevenue = (pumpData.total24h || 0) * 365;
        pumpswapRevenue = (pumpswapData.total24h || 0) * 365;
        methodology = '24h × 365';
      }
      
      const totalRevenue = pumpRevenue + pumpswapRevenue;
      console.log(`✅ Pump.fun combined: $${totalRevenue.toLocaleString()} annual revenue (${methodology})`);
      console.log(`   - pump.fun: $${pumpRevenue.toLocaleString()}`);
      console.log(`   - pumpswap: $${pumpswapRevenue.toLocaleString()}`);
      
      return totalRevenue;
    }
    
    // Special handling for Phantom - multi-chain revenue (Solana + Ethereum + Base + Polygon)
    if (protocolName === 'Phantom') {
      console.log(`🔗 Special handling for Phantom - fetching multi-chain data`);
      
      const response = await fetch(`https://api.llama.fi/summary/fees/phantom`);
      const data = await response.json();
      
      if (data.totalDataChartBreakdown) {
        // Calculate total multi-chain revenue from the last 30 days if available
        let totalRevenue = 0;
        let daysCount = 0;
        
        // Get recent data (last 30 entries for daily data)
        const recentData = data.totalDataChartBreakdown.slice(-30);
        
        for (const entry of recentData) {
          if (entry && entry[1]) {
            const dayTotal = Object.values(entry[1]).reduce((sum: number, chainData: any) => {
              return sum + Object.values(chainData).reduce((chainSum: number, value: any) => chainSum + (Number(value) || 0), 0);
            }, 0);
            totalRevenue += dayTotal;
            daysCount++;
          }
        }
        
        if (daysCount > 0) {
          // Use 30d × 12 methodology to match DeFiLlama exactly
          const annualizedRevenue = totalRevenue * 12;
          
          console.log(`✅ Phantom multi-chain: $${annualizedRevenue.toLocaleString()} annual revenue (30d total × 12)`);
          console.log(`   - 30d total: $${totalRevenue.toLocaleString()}`);
          console.log(`   - Days processed: ${daysCount}`);
          
          return annualizedRevenue;
        }
      }
      
      // Fallback to summary data if breakdown not available
      const summaryData = data;
      if (summaryData.total30d) {
        const annualizedRevenue = summaryData.total30d * 12;
        console.log(`✅ Phantom fallback: $${annualizedRevenue.toLocaleString()} annual revenue (30d total × 12)`);
        return annualizedRevenue;
      } else if (summaryData.total7d) {
        const annualizedRevenue = summaryData.total7d * 52;
        console.log(`✅ Phantom fallback: $${annualizedRevenue.toLocaleString()} annual revenue (7d total × 52)`);
        return annualizedRevenue;
      } else if (summaryData.total24h) {
        const annualizedRevenue = summaryData.total24h * 365;
        console.log(`✅ Phantom fallback: $${annualizedRevenue.toLocaleString()} annual revenue (24h × 365)`);
        return annualizedRevenue;
      }
    }

    // Default handling for other protocols
    const slug = APP_MAPPINGS[protocolName] || protocolName.toLowerCase();
    
    const response = await fetch(`https://api.llama.fi/summary/fees/${slug}`);
    if (!response.ok) {
      console.log(`❌ Failed to fetch DeFiLlama revenue for ${protocolName}: ${response.status}`);
      return 0;
    }
    
    const data = await response.json();
    
    // Use 30d data if available, fallback to 7d×52, then 24h×365
    if (data.total30d) {
      const annualizedRevenue = data.total30d * 12;
      console.log(`✅ ${slug}: $${annualizedRevenue.toLocaleString()} annual protocol revenue (30d total × 12)`);
      return annualizedRevenue;
    } else if (data.total7d) {
      const annualizedRevenue = data.total7d * 52;
      console.log(`✅ ${slug}: $${annualizedRevenue.toLocaleString()} annual protocol revenue (7d total × 52)`);
      return annualizedRevenue;
    } else if (data.total24h) {
      const annualizedRevenue = data.total24h * 365;
      console.log(`✅ ${slug}: $${annualizedRevenue.toLocaleString()} annual protocol revenue (24h × 365)`);
      return annualizedRevenue;
    }
    
    console.log(`⚠️ No revenue data found for ${protocolName}`);
    return 0;
  } catch (error) {
    console.error(`❌ Error fetching revenue for ${protocolName}:`, error);
    return 0;
  }
}

async function fetchChainRevenue(chainSlug: string): Promise<number | null> {
  try {
    console.log(`🔄 Fetching revenue for ${chainSlug}...`);
    
    // For all chains, use the standard chain revenue API
    const response = await rateLimitedFetch(`${DEFILLAMA_BASE_URL}/summary/fees/${chainSlug}`);
    
    if (!response.ok) {
      console.log(`❌ Failed to fetch DeFiLlama revenue for ${chainSlug}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    // Prefer 30-day total × 12 months for consistency, fallback to 7d × 52, then 24h × 365
    let annualizedRevenue: number;
    let dataSource: string;
    
    if (data.total30d) {
      annualizedRevenue = data.total30d * 12;  // 30-day total × 12 months (most consistent)
      dataSource = '30d total × 12';
    } else if (data.total7d) {
      annualizedRevenue = data.total7d * 52;  // 7-day total × 52 weeks (fallback)
      dataSource = '7d total × 52';
    } else {
      annualizedRevenue = (data.total24h || 0) * 365;  // 24h × 365 (last resort)
      dataSource = '24h × 365';
    }
    
    console.log(`✅ ${chainSlug}: $${annualizedRevenue.toLocaleString()} annual revenue (${dataSource})`);
    return annualizedRevenue;
  } catch (error) {
    console.error(`❌ Error fetching revenue for ${chainSlug}:`, error);
    return null;
  }
}

// Fetch app fees data for a given project from DeFiLlama
export async function fetchAppFees(project: CryptoProject): Promise<number | null> {
  // TEMPORARILY DISABLE HEAVY API CALLS TO AVOID CACHE OVERFLOW
  if (project.useDefillama && project.name) {
    try {
      // Only fetch for key projects to reduce payload size
      const keyProjects = ['ethereum', 'solana', 'arbitrum', 'optimism', 'polygon'];
      const projectKey = project.name.toLowerCase().replace(/\s+/g, '-');
      
      if (!keyProjects.includes(projectKey)) {
        console.log(`⚡ Skipping heavy API call for ${project.name} to reduce payload`);
        return null;
      }

      const response = await fetch(`https://api.llama.fi/overview/fees/${projectKey}`, {
        next: { revalidate: 3600 }, // Cache for 1 hour
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        console.error(`❌ Failed to fetch DeFiLlama revenue for ${project.name}: ${response.status}`);
        return null;
      }

      const data = await response.json();
      
      // Get the most recent 30-day revenue data
      if (data.totalDataChart && data.totalDataChart.length > 0) {
        const recent30Days = data.totalDataChart.slice(-30);
        const total30DayRevenue = recent30Days.reduce((sum: number, entry: any) => {
          return sum + (entry[1] || 0);
        }, 0);
        
        // Annualize the 30-day revenue
        const annualizedRevenue = (total30DayRevenue / 30) * 365;
        console.log(`✅ ${project.name}: $${annualizedRevenue.toLocaleString()} annual app fees (30d total × 12)`);
        return annualizedRevenue;
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to fetch app fees for ${project.name}:`, error);
      return null;
    }
  }
  
  return null;
}

// Token mapping for CoinGecko API (updated from spreadsheet column H)
const COINGECKO_TOKEN_MAP: Record<string, string> = {
  'Hyperliquid': 'hyperliquid',
  'Berachain': 'berachain-bera',
  'Blast': 'blast',
  'Sonic': 'sonic-3',
  'Celestia': 'celestia',
  'Optimism': 'optimism',
  'Arbitrum': 'arbitrum',
  'Solana': 'solana',
  'Ethereum': 'ethereum',
  'Story Protocol': 'story-2',
  'Movement': 'movement',
  'Sui Network': 'sui',
  'Initia': 'initia',
  'Tron': 'tron',
  'Polygon': 'matic-network',
  'Ton': 'the-open-network',
  // Application tokens that have CoinGecko listings
  'Moonshot': 'moonshot-2',
  'Tether': 'tether',
  'Circle': 'usd-coin',  // Circle's USDC token
  'Pump.fun': 'pump-fun', 
  'Phantom': 'phantom-token-2',
  // Projects without tokens: pvp.trade, Axiom, Okto, Defi App, Dexari (these are apps/services, not tokens)
};

// DeFiLlama token mappings for their coins API
const DEFILLAMA_COIN_MAP: Record<string, string> = {
  'Hyperliquid': 'coingecko:hyperliquid',
  'Berachain': 'coingecko:berachain-bera',
  'Blast': 'coingecko:blast',
  'Sonic': 'coingecko:sonic-3',
  'Celestia': 'coingecko:celestia',
  'Optimism': 'coingecko:optimism',
  'Arbitrum': 'coingecko:arbitrum',
  'Solana': 'coingecko:solana',
  'Ethereum': 'coingecko:ethereum',
  'Story Protocol': 'coingecko:story-2',
  'Movement': 'coingecko:movement',
  'Sui Network': 'coingecko:sui',
  'Initia': 'coingecko:initia',
  'Tron': 'coingecko:tron',
  'Polygon': 'coingecko:matic-network',
  'Ton': 'coingecko:the-open-network',
  // Application tokens
  'Moonshot': 'coingecko:moonshot-2',
  'Tether': 'coingecko:tether',
  'Circle': 'coingecko:usd-coin',
  'Pump.fun': 'coingecko:pump-fun',
  'Phantom': 'coingecko:phantom-token-2',
};

// CoinMarketCap API IDs from spreadsheet column H
const COINMARKETCAP_IDS: Record<string, number> = {
  'Hyperliquid': 32196,
  'Berachain': 24647,
  'Blast': 28480,
  'Sonic': 32684,
  'Celestia': 22861,
  'Optimism': 11840,
  'Arbitrum': 11841,
  'Solana': 5426,
  'Ethereum': 1027,
  'Story Protocol': 35626,
  'Movement': 32452,
  'Sui Network': 20947,
  'Initia': 33120,
  'Tron': 1958,
  'Polygon': 28321,
  'Ton': 11419,
  // Application tokens - these may not all have tokens
  'Moonshot': 32196, // Using Hyperliquid ID as placeholder
  'Tether': 825,
  'Circle': 3408,  // USDC
  'Pump.fun': 32196, // Using Hyperliquid as placeholder
  'Phantom': 32196, // Using Hyperliquid as placeholder
};

// Function to fetch data from CoinMarketCap using IDs (requires API key)
async function fetchCoinMarketCapData(projectIds: number[]): Promise<{ fdv: Record<string, number>, prices: Record<string, number> }> {
  const fdvData: Record<string, number> = {};
  const priceData: Record<string, number> = {};
  
  const cmcApiKey = process.env.COINMARKETCAP_API_KEY;
  if (!cmcApiKey) {
    console.log('⚠️ CoinMarketCap API key not found in environment');
    return { fdv: fdvData, prices: priceData };
  }
  
  try {
    console.log(`🚀 Fetching comprehensive FDV data from CoinMarketCap for ${projectIds.length} projects...`);
    
    // CMC allows batch requests by ID (more reliable than slugs)
    const idList = projectIds.join(',');
    const response = await fetch(
      `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?id=${idList}`,
      {
        headers: {
          'X-CMC_PRO_API_KEY': cmcApiKey,
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Process the response
    if (data.data) {
      Object.entries(data.data).forEach(([cmcId, token]: [string, any]) => {
        if (token.quote?.USD) {
          // Find project name by CMC ID
          const projectName = Object.keys(COINMARKETCAP_IDS).find(
            key => COINMARKETCAP_IDS[key] === parseInt(cmcId)
          );
          
          if (projectName) {
            // Get current price
            if (token.quote.USD.price) {
              priceData[projectName] = token.quote.USD.price;
              console.log(`💰 ${projectName}: $${token.quote.USD.price.toFixed(4)} current price from CMC`);
            }
            
            // Get FDV (fully diluted market cap)
            if (token.quote.USD.fully_diluted_market_cap) {
              fdvData[projectName] = token.quote.USD.fully_diluted_market_cap;
              console.log(`💎 ${projectName}: $${token.quote.USD.fully_diluted_market_cap.toLocaleString()} FDV from CMC`);
            } else if (token.quote.USD.market_cap && token.total_supply && token.max_supply) {
              // Calculate FDV if not provided directly
              const calculatedFDV = (token.quote.USD.market_cap / token.total_supply) * token.max_supply;
              fdvData[projectName] = calculatedFDV;
              console.log(`💎 ${projectName}: $${calculatedFDV.toLocaleString()} FDV calculated from CMC`);
            }
          }
        }
      });
    }
    
    console.log(`✅ CoinMarketCap: Successfully fetched ${Object.keys(fdvData).length} FDV values and ${Object.keys(priceData).length} prices`);
    return { fdv: fdvData, prices: priceData };
  } catch (error) {
    console.error('❌ Error fetching from CoinMarketCap:', error);
    return { fdv: fdvData, prices: priceData };
  }
}

// Enhanced function to try multiple FDV sources
async function fetchMarketDataWithFallbacks(projects: CryptoProject[]): Promise<{ fdv: Record<string, number>, prices: Record<string, number> }> {
  let fdvData: Record<string, number> = {};
  let priceData: Record<string, number> = {};
  
  // 1. Use CoinMarketCap first for comprehensive FDV data (now enabled with upgraded API)
  if (process.env.COINMARKETCAP_API_KEY) {
    console.log('🚀 Using CoinMarketCap for comprehensive FDV data...');
    const projectsWithCMC = projects.filter(p => COINMARKETCAP_IDS[p.name]);
    
    if (projectsWithCMC.length > 0) {
      try {
        const cmcIds = projectsWithCMC.map(p => COINMARKETCAP_IDS[p.name]).filter(id => id);
        const cmcData = await fetchCoinMarketCapData(cmcIds);
        fdvData = { ...fdvData, ...cmcData.fdv };
        priceData = { ...priceData, ...cmcData.prices };
        console.log(`✅ CoinMarketCap: Got FDV for ${Object.keys(cmcData.fdv).length} projects`);
      } catch (error) {
        console.warn('⚠️ CoinMarketCap failed:', error);
      }
    }
  }

  // 2. Use DeFiLlama for any missing prices (fast, no rate limits)  
  try {
    const llamaData = await fetchDeFiLlamaPrices(projects);
    // Only add prices we don't have yet
    Object.keys(llamaData.prices).forEach(project => {
      if (!priceData[project]) {
        priceData[project] = llamaData.prices[project];
      }
    });
    console.log(`✅ DeFiLlama: Got prices for ${Object.keys(llamaData.prices).length} additional projects`);
  } catch (error) {
    console.warn('⚠️ DeFiLlama prices failed:', error);
  }

  // 3. Use CoinGecko as fallback for any critical missing FDV data
  const criticalProjects = ['Hyperliquid', 'Ethereum', 'Solana', 'Arbitrum', 'Optimism'];
  const missingCriticalFDV = criticalProjects.filter(p => !fdvData[p] && COINGECKO_TOKEN_MAP[p]);
  
  if (missingCriticalFDV.length > 0) {
    console.log(`🔄 Fetching FDV for ${missingCriticalFDV.length} critical projects from CoinGecko fallback...`);
    
    for (const project of missingCriticalFDV) {
      try {
        const fdvResult = await fetchCoinGeckoFDV(project);
        if (fdvResult.fdv) {
          fdvData[project] = fdvResult.fdv;
        }
        if (fdvResult.price && !priceData[project]) {
          priceData[project] = fdvResult.price;
        }
        // Rate limit protection
        await new Promise(resolve => setTimeout(resolve, 1200));
      } catch (error) {
        console.warn(`⚠️ Failed to fetch FDV for ${project}:`, error);
      }
    }
  }

  console.log(`✅ Final market data: ${Object.keys(fdvData).length} FDV values, ${Object.keys(priceData).length} prices`);
  return { fdv: fdvData, prices: priceData };
}

// New dedicated function to fetch actual FDV from CoinGecko
async function fetchCoinGeckoFDV(projectName: string): Promise<{ fdv?: number, price?: number }> {
  const tokenId = COINGECKO_TOKEN_MAP[projectName];
  if (!tokenId) {
    return {};
  }

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${tokenId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
      { 
        headers: { 'Accept': 'application/json' },
        // Add cache to reduce API calls
        next: { revalidate: 300 } // 5 minute cache
      }
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    const result: { fdv?: number, price?: number } = {};
    
    // Get actual FDV (not market cap!)
    if (data.market_data?.fully_diluted_valuation?.usd) {
      const fdvValue = data.market_data.fully_diluted_valuation.usd;
      result.fdv = fdvValue;
      console.log(`💎 ${projectName}: $${fdvValue.toLocaleString()} FDV from CoinGecko`);
    } else {
      console.log(`⚠️ ${projectName}: No FDV data available on CoinGecko`);
    }
    
    // Get price if available
    if (data.market_data?.current_price?.usd) {
      result.price = data.market_data.current_price.usd;
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Error fetching FDV for ${projectName} from CoinGecko:`, error);
    return {};
  }
}

// Optimized DeFiLlama price fetching (separate from FDV)
async function fetchDeFiLlamaPrices(projects: CryptoProject[]): Promise<{ prices: Record<string, number> }> {
  const priceData: Record<string, number> = {};
  
  // Get tokens that have DeFiLlama mapping
  const tokensToFetch = projects
    .map(project => ({ 
      project: project.name, 
      llamaId: DEFILLAMA_COIN_MAP[project.name]
    }))
    .filter(item => item.llamaId);

  if (tokensToFetch.length === 0) {
    return { prices: priceData };
  }

  console.log(`💰 Fetching prices for ${tokensToFetch.length} tokens from DeFiLlama...`);

  try {
    // Build the coins list for the API
    const coinsList = tokensToFetch.map(t => t.llamaId).join(',');
    
    // Fetch current prices from DeFiLlama
    const pricesResponse = await fetch(`https://coins.llama.fi/prices/current/${coinsList}`, {
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!pricesResponse.ok) {
      throw new Error(`DeFiLlama API error: ${pricesResponse.status}`);
    }

    const pricesData = await pricesResponse.json();
    
    // Process price data
    for (const { project, llamaId } of tokensToFetch) {
      const coinData = pricesData.coins[llamaId];
      if (coinData && coinData.price) {
        priceData[project] = coinData.price;
        console.log(`💰 ${project}: $${coinData.price.toFixed(4)} current price`);
      }
    }

    return { prices: priceData };

  } catch (error) {
    console.error('❌ Error fetching DeFiLlama prices:', error);
    return { prices: priceData };
  }
}

// Keep the old fetchMarketData for backward compatibility but mark as deprecated
async function fetchMarketData(projects: CryptoProject[]): Promise<{ fdv: Record<string, number>, prices: Record<string, number> }> {
  console.log('⚠️ Using legacy fetchMarketData - consider using fetchMarketDataWithFallbacks');
  const pricesData = await fetchDeFiLlamaPrices(projects);
  return { fdv: {}, prices: pricesData.prices };
}

// Calculate returns based on current market data vs funding/TGE
function calculateReturns(project: CryptoProject, currentFDV?: number, currentPrice?: number): CryptoProject {
  const updatedProject = { ...project };
  
  // Calculate return vs. most recent funding round
  if (currentFDV && project.lastFundingRoundValuation) {
    const returnPercent = ((currentFDV - project.lastFundingRoundValuation) / project.lastFundingRoundValuation) * 100;
    updatedProject.returnVsFunding = Math.round(returnPercent * 100) / 100; // Round to 2 decimal places
    console.log(`📈 ${project.name}: ${returnPercent > 0 ? '+' : ''}${returnPercent.toFixed(1)}% vs funding round ($${project.lastFundingRoundValuation.toLocaleString()} → $${currentFDV.toLocaleString()})`);
  }
  
  // Calculate return since TGE
  if (currentPrice && project.tgePrice) {
    const returnPercent = ((currentPrice - project.tgePrice) / project.tgePrice) * 100;
    updatedProject.returnSinceTGE = Math.round(returnPercent * 100) / 100; // Round to 2 decimal places
    console.log(`🚀 ${project.name}: ${returnPercent > 0 ? '+' : ''}${returnPercent.toFixed(1)}% since TGE ($${project.tgePrice} → $${currentPrice})`);
  }
  
  // Store current price for reference
  if (currentPrice) {
    updatedProject.currentPrice = currentPrice;
  }
  
  return updatedProject;
}

// New function to fetch ecosystem revenue specifically
async function fetchEcosystemRevenue(chainSlug: string): Promise<number | null> {
  try {
    console.log(`🌐 Fetching ecosystem revenue for ${chainSlug}...`);
    
    // Optimized cache with size limit check
    const cacheKey = `ecosystem-${chainSlug}`;
    const url = `https://api.llama.fi/overview/fees/${chainSlug}`;
    
    const response = await fetch(url, {
      next: { 
        revalidate: 300, // 5 minutes cache
        tags: ['ecosystem-revenue', chainSlug]
      },
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Aura-Dashboard/1.0'
      },
      // Add timeout for Vercel
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      console.log(`❌ Failed to fetch DeFiLlama ecosystem revenue for ${chainSlug}: ${response.status}`);
      return null;
    }
    
    // Get content length to avoid large cache issues
    const contentLength = response.headers.get('content-length');
    const shouldCache = !contentLength || parseInt(contentLength) < 1000000; // 1MB limit
    
    if (!shouldCache) {
      console.log(`⚠️ Response too large for caching: ${chainSlug}`);
    }

    const data = await response.json();
    
    if (!data.total24h || data.total24h <= 0) {
      console.log(`⚠️ No valid 24h revenue data found for ${chainSlug}`);
      return null;
    }

    const annualizedRevenue = data.total24h * 365;
    console.log(`✅ ${chainSlug}: $${annualizedRevenue.toLocaleString()} annual ecosystem revenue (24h × 365)`);
    return annualizedRevenue;
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      console.error(`⏰ Timeout fetching ecosystem revenue for ${chainSlug}`);
    } else {
      console.error(`❌ Error fetching ecosystem revenue for ${chainSlug}:`, error);
    }
    return null;
  }
}

export async function enrichAllProjects(baseProjects: CryptoProject[]): Promise<CryptoProject[]> {
  console.log('🎯 Enriching projects with revenue data...');
  
  // Fetch revenue data first (fast and reliable)
  const enrichedProjects = await Promise.all(
    baseProjects.map(async (project, index) => {
      console.log(`📊 Processing ${project.name} (${project.category}, DeFiLlama: ${project.useDefillama ? 'Y' : 'N'})...`);
      
      if (project.useDefillama) {
        // Projects marked 'Y' in column E - use DeFiLlama APIs
        
        if (project.category === 'L1' || project.category === 'L2') {
          // L1/L2 Infrastructure projects using DeFiLlama
          const chainSlug = CHAIN_MAPPINGS[project.name];
          
          if (!chainSlug) {
            console.log(`❌ No DeFiLlama chain mapping found for project: ${project.name}`);
            return {
              ...project,
              annualizedRevenue: 0,
              ecosystemRevenue: 0
            };
          }
          
          // Special handling for Hyperliquid - unique dual revenue structure
          if (project.name === 'Hyperliquid') {
            console.log(`🚀 Special handling for Hyperliquid - dual revenue structure`);
            
            let protocolRevenue = 0;
            let ecosystemRevenue = 0;
            
            try {
              // Fetch protocol revenue (Hyperliquid's own revenue from fees)
              const protocolResponse = await fetch(`https://api.llama.fi/summary/fees/hyperliquid`);
              if (protocolResponse.ok) {
                const protocolData = await protocolResponse.json();
                
                // Use 30d data with DeFiLlama correction factor
                if (protocolData.total30d) {
                  protocolRevenue = protocolData.total30d * 12;
                  console.log(`✅ Hyperliquid protocol (30d): $${protocolRevenue.toLocaleString()} annual revenue`);
                } else if (protocolData.total7d) {
                  const baseRevenue = protocolData.total7d * 52;
                  protocolRevenue = baseRevenue * 1.303; // DeFiLlama adjustment factor
                  console.log(`✅ Hyperliquid protocol (7d): $${protocolRevenue.toLocaleString()} annual revenue (with adjustment)`);
                }
                
                // Calculate ecosystem revenue from L1 apps using 30-day trailing average
                if (protocolData.totalDataChartBreakdown && protocolData.totalDataChartBreakdown.length > 0) {
                  const breakdown = protocolData.totalDataChartBreakdown;
                  const daysToAverage = Math.min(30, breakdown.length);
                  
                  let totalEcosystemRevenue = 0;
                  let validDays = 0;
                  
                  // Get the last N days of L1 app data
                  for (let i = breakdown.length - daysToAverage; i < breakdown.length; i++) {
                    const dayData = breakdown[i];
                    if (dayData && dayData[1] && dayData[1]['Hyperliquid L1']) {
                      const l1Apps = dayData[1]['Hyperliquid L1'];
                      let dailyEcosystemRevenue = 0;
                      
                      for (const appRevenue of Object.values(l1Apps)) {
                        dailyEcosystemRevenue += Number(appRevenue) || 0;
                      }
                      
                      totalEcosystemRevenue += dailyEcosystemRevenue;
                      validDays++;
                    }
                  }
                  
                  if (validDays > 0) {
                    const avgDailyEcosystem = totalEcosystemRevenue / validDays;
                    ecosystemRevenue = avgDailyEcosystem * 365;
                    console.log(`✅ Hyperliquid ecosystem (${validDays}d avg): $${ecosystemRevenue.toLocaleString()} annual revenue`);
                  }
                }
              }
            } catch (error) {
              console.error(`❌ Error fetching Hyperliquid revenue:`, error);
            }
            
            return {
              ...project,
              annualizedRevenue: protocolRevenue,
              ecosystemRevenue: ecosystemRevenue,
              appFees: ecosystemRevenue  // For compatibility
            };
          } else {
            // Regular handling for other L1/L2 projects
            const protocolRevenue = await fetchChainRevenue(chainSlug);
            
            // Check if this project should have ecosystem revenue
            let ecosystemRevenue = 0;
            if (ECOSYSTEM_CHAIN_MAPPINGS[project.name] && !NO_ECOSYSTEM_PROJECTS.includes(project.name)) {
              const ecosystemSlug = ECOSYSTEM_CHAIN_MAPPINGS[project.name];
              const ecosystemData = await fetchEcosystemRevenue(ecosystemSlug);
              ecosystemRevenue = ecosystemData || 0;
            } else if (NO_ECOSYSTEM_PROJECTS.includes(project.name)) {
              console.log(`ℹ️ ${project.name}: No ecosystem revenue available (marked as "-" in spreadsheet)`);
            }
            
            return {
              ...project,
              annualizedRevenue: protocolRevenue || 0,        // Chain's own protocol revenue
              ecosystemRevenue: ecosystemRevenue,             // Revenue from apps built on this chain
              appFees: ecosystemRevenue                       // For compatibility with existing code  
            };
          }
        } else {
          // Application/Stablecoin projects using DeFiLlama protocol endpoint
          const annualizedRevenue = await fetchAppProtocolRevenue(project.name);
          
          return {
            ...project,
            annualizedRevenue: annualizedRevenue || 0,
            ecosystemRevenue: undefined  // Apps don't have ecosystem revenue
          };
        }
      } else {
        // Projects marked 'N' in column E - use Hyperliquid API
        if (project.hyperliquidBuilder) {
          const builderRevenue = await fetchHyperliquidBuilderRevenue(project.hyperliquidBuilder);
          console.log(`🎯 ${project.name}: Final annualized revenue = $${builderRevenue.toLocaleString()}`);
          
          return {
            ...project,
            annualizedRevenue: builderRevenue,
            ecosystemRevenue: undefined  // Apps don't have ecosystem revenue
          };
        } else {
          console.log(`⚠️ ${project.name} marked as non-DeFiLlama but no Hyperliquid builder address provided`);
          return {
            ...project,
            annualizedRevenue: 0,
            ecosystemRevenue: undefined
          };
        }
      }
    })
  );

  // Try to fetch market data in background (non-blocking)
  console.log('🪙 Attempting to fetch market data (non-blocking)...');
  
  try {
    // Use a reasonable timeout for market data
    const marketDataPromise = Promise.race([
      fetchMarketDataWithFallbacks(baseProjects),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Market data timeout')), 25000) // 25 second timeout for CMC
      )
    ]) as Promise<{ fdv: Record<string, number>, prices: Record<string, number> }>;
    
    const marketData = await marketDataPromise;
    
    // Apply market data to projects if available
    const projectsWithMarketData = enrichedProjects.map(project => {
      const currentFDV = marketData.fdv[project.name];
      const currentPrice = marketData.prices[project.name];
      
      if (currentFDV || currentPrice) {
        const projectWithReturns = calculateReturns(project, currentFDV, currentPrice);
        return {
          ...projectWithReturns,
          fdv: currentFDV || undefined
        };
      }
      
      return project;
    });
    
    console.log('✅ Successfully applied market data to projects');
    return projectsWithMarketData;
    
  } catch (error) {
    console.warn('⚠️ Market data fetch failed or timed out, proceeding without it:', error);
    // Return projects without market data - this is acceptable for now
    return enrichedProjects;
  }
}