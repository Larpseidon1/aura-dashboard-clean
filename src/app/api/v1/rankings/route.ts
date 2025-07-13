import { NextRequest, NextResponse } from 'next/server';
import { enrichAllProjects } from '@/lib/externalApis';
import { CryptoProject } from '@/types';

// Base project data (same as comparison route)
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
  { name: 'pvp.trade', category: 'Application', secondaryCategory: 'Hyperliquid', amountRaised: 1_200_000, useDefillama: false, hyperliquidBuilder: '0x0cbf655b0d22ae71fba3a674b0e1c0c7e7f975af' },
  { name: 'Axiom', category: 'Application', amountRaised: 500_000, useDefillama: true, hyperliquidBuilder: '0x1cc34f6af34653c515b47a83e1de70ba9b0cda1f' },
  { name: 'Okto', category: 'Application', secondaryCategory: 'Hyperliquid', amountRaised: 27_000_000, useDefillama: false, hyperliquidBuilder: '0x6acc0acd626b29b48923228c111c94bd4faa6a43' },
  { name: 'Defi App', category: 'Application', secondaryCategory: 'Hyperliquid', amountRaised: 6_000_000, useDefillama: false, hyperliquidBuilder: '0x1922810825c90f4270048b96da7b1803cd8609ef', lastFundingRoundValuation: 100_000_000, tgePrice: 0.03 },
  { name: 'Dexari', category: 'Application', secondaryCategory: 'Hyperliquid', amountRaised: 2_300_000, useDefillama: false, hyperliquidBuilder: '0x7975cafdff839ed5047244ed3a0dd82a89866081' },
  { name: 'Moonshot', category: 'Application', amountRaised: 60_000_000, useDefillama: true },
  { name: 'Tether', category: 'Stablecoins', amountRaised: 69_420_000, useDefillama: true },
  { name: 'Circle', category: 'Stablecoins', amountRaised: 1_200_000_000, useDefillama: true },
  { name: 'Pump.fun', category: 'Application', amountRaised: 1_170_000, useDefillama: true, lastFundingRoundValuation: 12_000_000, tgePrice: 0.004 },
  { name: 'Phantom', category: 'Application', secondaryCategory: 'Hyperliquid', amountRaised: 268_000_000, useDefillama: false, hyperliquidBuilder: '0xb84168cf3be63c6b8dad05ff5d755e97432ff80b' }
];

// API configuration
export const runtime = 'nodejs';
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

// Cache for rankings data
let cachedRankings: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Rate limiting
const rateLimitMap = new Map();
function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 150;
  
  if (!rateLimitMap.has(clientId)) {
    rateLimitMap.set(clientId, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  const limit = rateLimitMap.get(clientId);
  if (now > limit.resetTime) {
    rateLimitMap.set(clientId, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (limit.count >= maxRequests) {
    return false;
  }
  
  limit.count++;
  return true;
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 150 requests per minute.' },
        { status: 429 }
      );
    }
    
    // Query parameters
    const category = request.nextUrl.searchParams.get('category');
    const metric = request.nextUrl.searchParams.get('metric') || 'auraScore';
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '25');
    const includeInsights = request.nextUrl.searchParams.get('insights') === 'true';
    
    // Check cache
    const now = Date.now();
    if (cachedRankings && (now - cacheTimestamp) < CACHE_DURATION) {
      const filteredData = filterAndSortRankings(cachedRankings, category, metric, limit, includeInsights);
      return NextResponse.json({
        ...filteredData,
        meta: {
          ...filteredData.meta,
          cached: true,
          cacheAge: Math.floor((now - cacheTimestamp) / 1000)
        }
      });
    }
    
    // Fetch fresh data
    console.log('🔄 API Rankings: Fetching fresh data...');
    const startTime = Date.now();
    
    const enrichedProjects = await enrichAllProjects(BASE_PROJECTS);
    
    // Calculate comprehensive rankings
    const rankings = calculateComprehensiveRankings(enrichedProjects);
    
    const responseTime = Date.now() - startTime;
    
    // Cache the full rankings
    cachedRankings = rankings;
    cacheTimestamp = now;
    
    // Filter and format response
    const responseData = filterAndSortRankings(rankings, category, metric, limit, includeInsights);
    
    console.log(`✅ API Rankings: Generated ${responseData.data.length} rankings in ${responseTime}ms`);
    
    return NextResponse.json({
      ...responseData,
      meta: {
        ...responseData.meta,
        responseTime,
        lastUpdated: new Date().toISOString(),
        cached: false
      },
      api: {
        version: '1.0',
        endpoint: '/api/v1/rankings',
        rateLimit: {
          limit: 150,
          remaining: 150 - (rateLimitMap.get(clientId)?.count || 1)
        }
      }
    });
    
  } catch (error) {
    console.error('❌ API Rankings Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to fetch rankings data'
      },
      { status: 500 }
    );
  }
}

function calculateComprehensiveRankings(projects: any[]) {
  // Calculate multiple ranking metrics
  const projectsWithMetrics = projects.map((project: any) => {
    const auraScore = calculateAuraScore(project);
    const revenueEfficiency = (project.annualizedRevenue || 0) / (project.amountRaised || 1);
    const marketCap = project.fdv || 0;
    const revenue = project.annualizedRevenue || 0;
    
    return {
      name: project.name,
      category: project.category,
      auraScore,
      revenueEfficiency,
      annualizedRevenue: revenue,
      marketCap,
      amountRaised: project.amountRaised || 0,
      fdv: project.fdv,
      currentPrice: project.currentPrice,
      tgePrice: project.tgePrice,
      returnSinceTGE: project.returnSinceTGE,
      returnVsFunding: project.returnVsFunding,
      lastFundingRoundValuation: project.lastFundingRoundValuation
    };
  });
  
  // Generate different rankings
  const rankings = {
    auraScore: [...projectsWithMetrics].sort((a, b) => b.auraScore - a.auraScore),
    revenue: [...projectsWithMetrics].sort((a, b) => b.annualizedRevenue - a.annualizedRevenue),
    efficiency: [...projectsWithMetrics].sort((a, b) => b.revenueEfficiency - a.revenueEfficiency),
    marketCap: [...projectsWithMetrics].sort((a, b) => b.marketCap - a.marketCap),
    funding: [...projectsWithMetrics].sort((a, b) => b.amountRaised - a.amountRaised),
    performance: [...projectsWithMetrics]
      .filter(p => p.returnSinceTGE !== undefined)
      .sort((a, b) => (b.returnSinceTGE || 0) - (a.returnSinceTGE || 0))
  };
  
  // Add rankings to each metric
  Object.keys(rankings).forEach(metric => {
    (rankings as any)[metric].forEach((project: any, index: number) => {
      project[`${metric}Rank`] = index + 1;
    });
  });
  
  return rankings;
}

function filterAndSortRankings(rankings: any, category: string | null, metric: string, limit: number, includeInsights: boolean) {
  let data = rankings[metric] || rankings.auraScore;
  
  // Filter by category
  if (category) {
    data = data.filter((p: any) => p.category.toLowerCase() === category.toLowerCase());
  }
  
  // Apply limit
  data = data.slice(0, limit);
  
  // Add insights if requested
  if (includeInsights) {
    data = data.map((project: any, index: number) => ({
      ...project,
      insights: {
        rank: index + 1,
        percentile: Math.round((1 - index / data.length) * 100),
        categoryLeader: index === 0 && category,
        overallRank: project.auraScoreRank || 'N/A',
        strengths: identifyStrengths(project),
        weaknesses: identifyWeaknesses(project)
      }
    }));
  }
  
  return {
    data,
    meta: {
      total: data.length,
      category: category || 'all',
      metric,
      limit,
      includeInsights,
      availableMetrics: ['auraScore', 'revenue', 'efficiency', 'marketCap', 'funding', 'performance'],
      availableCategories: ['L1', 'L2', 'Application', 'Stablecoins']
    }
  };
}

function calculateAuraScore(project: any): number {
  const revenue = project.annualizedRevenue || 0;
  const amountRaised = project.amountRaised || 1;
  const fdv = project.fdv || 0;
  
  let score = 0;
  
  // Revenue efficiency (primary factor)
  const revenueEfficiency = revenue / amountRaised;
  score += revenueEfficiency * 0.6;
  
  // Market performance
  if (fdv > 0 && project.lastFundingRoundValuation) {
    const marketPerformance = fdv / project.lastFundingRoundValuation;
    score += Math.log10(marketPerformance + 1) * 0.3;
  }
  
  // Revenue scale bonus
  const revenueScale = Math.log10(revenue + 1) / 10;
  score += revenueScale * 0.1;
  
  return Math.round(score * 100) / 100;
}

function identifyStrengths(project: any): string[] {
  const strengths = [];
  
  if (project.revenueEfficiency > 10) strengths.push('Exceptional revenue efficiency');
  if (project.annualizedRevenue > 1000000000) strengths.push('High revenue scale');
  if (project.returnSinceTGE && project.returnSinceTGE > 100) strengths.push('Strong token performance');
  if (project.marketCap > 10000000000) strengths.push('Large market cap');
  
  return strengths.length > 0 ? strengths : ['Developing fundamentals'];
}

function identifyWeaknesses(project: any): string[] {
  const weaknesses = [];
  
  if (project.revenueEfficiency < 0.1) weaknesses.push('Low revenue efficiency');
  if (project.annualizedRevenue < 1000000) weaknesses.push('Limited revenue scale');
  if (project.returnSinceTGE && project.returnSinceTGE < -50) weaknesses.push('Poor token performance');
  
  return weaknesses;
} 