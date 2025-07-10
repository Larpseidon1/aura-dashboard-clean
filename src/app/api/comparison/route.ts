import { NextRequest, NextResponse } from 'next/server';
import { CryptoProject, ComparisonData } from '@/types';
import { enrichAllProjects } from '@/lib/externalApis';

// Vercel function configuration
export const runtime = 'nodejs'; // Use Node.js runtime for better performance
export const maxDuration = 30; // Maximum 30 seconds (Vercel limit)
export const dynamic = 'force-dynamic'; // Always fresh data
export const revalidate = 300; // Cache for 5 minutes

// Base project data from the spreadsheet
const BASE_PROJECTS: CryptoProject[] = [
  { name: 'Hyperliquid', category: 'L1', amountRaised: 0, useDefillama: true, tgePrice: 3.81 },
  { name: 'Berachain', category: 'L1', amountRaised: 211_000_000, useDefillama: true, lastFundingRoundValuation: 1_500_000_000, tgePrice: 15.00 },
  { name: 'Blast', category: 'L2', amountRaised: 20_000_000, useDefillama: true, lastFundingRoundValuation: 100_000_000, tgePrice: 0.03 },
  { name: 'Sonic', category: 'L1', amountRaised: 29_350_000, useDefillama: true, lastFundingRoundValuation: 100_000_000, tgePrice: 0.32 },
  { name: 'Celestia', category: 'L1', amountRaised: 155_000_000, useDefillama: true, lastFundingRoundValuation: 1_500_000_000, tgePrice: 1.50 },
  { name: 'Optimism', category: 'L2', amountRaised: 267_500_000, useDefillama: true, lastFundingRoundValuation: 1_650_000_000, tgePrice: 1.91 },
  { name: 'Arbitrum', category: 'L2', amountRaised: 143_700_000, useDefillama: true, lastFundingRoundValuation: 4_500_000_000, tgePrice: 1.20 },
  { name: 'Solana', category: 'L1', amountRaised: 319_500_000, useDefillama: true, lastFundingRoundValuation: 110_000_000, tgePrice: 0.22 },
  { name: 'Ethereum', category: 'L1', amountRaised: 18_000_000, useDefillama: true, lastFundingRoundValuation: 22_000_000, tgePrice: 0.31 },
  { name: 'Story Protocol', category: 'L1', amountRaised: 143_000_000, useDefillama: true, lastFundingRoundValuation: 2_250_000_000, tgePrice: 2.50 },
  { name: 'Movement', category: 'L1', amountRaised: 55_000_000, useDefillama: true, lastFundingRoundValuation: 1_600_000_000, tgePrice: 0.68 },
  { name: 'Sui Network', category: 'L1', amountRaised: 336_000_000, useDefillama: true, lastFundingRoundValuation: 1_500_000_000, tgePrice: 0.10 },
  { name: 'Initia', category: 'L1', amountRaised: 24_000_000, useDefillama: true, lastFundingRoundValuation: 600_000_000, tgePrice: 0.60 },
  { name: 'Tron', category: 'L1', amountRaised: 76_000_000, useDefillama: true, tgePrice: 0.002 },
  { name: 'Polygon', category: 'L1', amountRaised: 450_000_000, useDefillama: true, tgePrice: 0.003 },
  { name: 'Ton', category: 'L1', amountRaised: 658_000_000, useDefillama: true, tgePrice: 0.78 },
  
  // Apps from the spreadsheet
  { name: 'pvp.trade', category: 'Application', secondaryCategory: 'Hyperliquid', amountRaised: 1_200_000, useDefillama: false, hyperliquidBuilder: '0x0cbf655b0d22ae71fba3a674b0e1c0c7e7f975af' },
  { name: 'Axiom', category: 'Application', amountRaised: 500_000, useDefillama: true, hyperliquidBuilder: '0x1cc34f6af34653c515b47a83e1de70ba9b0cda1f' },
  { name: 'Okto', category: 'Application', secondaryCategory: 'Hyperliquid', amountRaised: 27_000_000, useDefillama: false, hyperliquidBuilder: '0x6acc0acd626b29b48923228c111c94bd4faa6a43' },
  { name: 'Defi App', category: 'Application', secondaryCategory: 'Hyperliquid', amountRaised: 6_000_000, useDefillama: false, hyperliquidBuilder: '0x1922810825c90f4270048b96da7b1803cd8609ef', lastFundingRoundValuation: 100_000_000, tgePrice: 0.03 },
  { name: 'Dexari', category: 'Application', secondaryCategory: 'Hyperliquid', amountRaised: 2_300_000, useDefillama: false, hyperliquidBuilder: '0x7975cafdff839ed5047244ed3a0dd82a89866081' },
  
  // New apps from spreadsheet update
  { name: 'Moonshot', category: 'Application', amountRaised: 60_000_000, useDefillama: true },
  { name: 'Tether', category: 'Stablecoins', amountRaised: 69_420_000, useDefillama: true },
  { name: 'Circle', category: 'Stablecoins', amountRaised: 1_200_000_000, useDefillama: true },
  { name: 'Pump.fun', category: 'Application', amountRaised: 1_170_000, useDefillama: true, lastFundingRoundValuation: 12_000_000, tgePrice: 0.004 },
  { name: 'Phantom', category: 'Application', amountRaised: 268_000_000, useDefillama: true }
];

// In-memory cache for quick responses
let cachedData: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('📊 API request started');
    
    // Check cache first for better performance
    const now = Date.now();
    if (cachedData && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('🚀 Returning cached comparison data');
      return NextResponse.json(cachedData, {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=300',
          'X-Cache': 'HIT',
          'X-Response-Time': `${Date.now() - startTime}ms`
        }
      });
    }

    console.log('🔄 Fetching fresh comparison data...');
    
    // Use Promise.race for timeout protection
    const enrichedProjects = await Promise.race([
      enrichAllProjects(BASE_PROJECTS),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('API timeout - please try again')), 25000) // 25s timeout
      )
    ]) as CryptoProject[];

    const responseData = {
      projects: enrichedProjects,
      lastUpdated: new Date().toISOString(),
      totalProjects: enrichedProjects.length,
      responseTime: Date.now() - startTime
    };

    // Update cache
    cachedData = responseData;
    cacheTimestamp = now;

    console.log(`✅ Successfully fetched and cached comparison data (${Date.now() - startTime}ms)`);
    
    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=300',
        'X-Cache': 'MISS',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    });

  } catch (error) {
    console.error('❌ Error fetching comparison data:', error);
    
    // Return cached data if available, even if stale
    if (cachedData) {
      console.log('⚠️ Returning stale cached data due to error');
      return NextResponse.json({
        ...cachedData,
        isStale: true,
        error: 'Fresh data unavailable, showing cached results'
      }, {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=30, s-maxage=60',
          'X-Cache': 'STALE',
          'X-Response-Time': `${Date.now() - startTime}ms`
        }
      });
    }

    // Fallback error response
    return NextResponse.json({
      error: 'Unable to fetch data',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    });
  }
}

// Health check endpoint
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache'
    }
  });
} 