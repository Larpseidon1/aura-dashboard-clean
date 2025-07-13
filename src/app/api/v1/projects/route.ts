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

// Cache for API responses
let cachedData: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// API key validation (basic implementation)
function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key') || request.nextUrl.searchParams.get('api_key');
  
  // For now, allow public access - implement proper API key system later
  return true;
}

// Rate limiting helper
const rateLimitMap = new Map();
function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100; // 100 requests per minute
  
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
    // API key validation
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      );
    }
    
    // Rate limiting
    const clientId = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 100 requests per minute.' },
        { status: 429 }
      );
    }
    
    // Check cache
    const now = Date.now();
    if (cachedData && (now - cacheTimestamp) < CACHE_DURATION) {
      return NextResponse.json({
        ...cachedData,
        cached: true,
        cacheAge: Math.floor((now - cacheTimestamp) / 1000)
      });
    }
    
    // Query parameters
    const category = request.nextUrl.searchParams.get('category');
    const sortBy = request.nextUrl.searchParams.get('sort') || 'auraScore';
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0');
    
    // Fetch fresh data
    console.log('🔄 API: Fetching fresh project data...');
    const startTime = Date.now();
    
    const enrichedProjects = await enrichAllProjects(BASE_PROJECTS);
    
    // Calculate Aura Scores for each project
    const projectsWithScores = enrichedProjects.map((project: any) => {
      const auraScore = calculateAuraScore(project);
      return {
        ...project,
        auraScore,
        auraRank: 0 // Will be set after sorting
      };
    });
    
    // Sort by Aura Score (descending)
    projectsWithScores.sort((a, b) => b.auraScore - a.auraScore);
    
    // Add rankings
    projectsWithScores.forEach((project, index) => {
      project.auraRank = index + 1;
    });
    
    // Filter by category if specified
    let filteredProjects = projectsWithScores;
    if (category) {
      filteredProjects = projectsWithScores.filter(p => 
        p.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    // Apply sorting
    if (sortBy !== 'auraScore') {
      filteredProjects.sort((a, b) => {
        const aVal = a[sortBy] || 0;
        const bVal = b[sortBy] || 0;
        return bVal - aVal; // Descending order
      });
    }
    
    // Apply pagination
    const paginatedProjects = filteredProjects.slice(offset, offset + limit);
    
    const responseTime = Date.now() - startTime;
    
    const response = {
      data: paginatedProjects,
      meta: {
        total: filteredProjects.length,
        totalProjects: projectsWithScores.length,
        limit,
        offset,
        category: category || 'all',
        sortBy,
        responseTime,
        lastUpdated: new Date().toISOString(),
        cached: false
      },
      api: {
        version: '1.0',
        rateLimit: {
          limit: 100,
          remaining: 100 - (rateLimitMap.get(clientId)?.count || 1),
          resetTime: rateLimitMap.get(clientId)?.resetTime || Date.now() + 60000
        }
      }
    };
    
    // Cache the response
    cachedData = response;
    cacheTimestamp = now;
    
    console.log(`✅ API: Returned ${paginatedProjects.length} projects in ${responseTime}ms`);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to fetch project data'
      },
      { status: 500 }
    );
  }
}

// Aura Score calculation function
function calculateAuraScore(project: any): number {
  const revenue = project.annualizedRevenue || 0;
  const amountRaised = project.amountRaised || 1; // Avoid division by zero
  const fdv = project.fdv || 0;
  
  // Basic Aura Score formula: Revenue efficiency with market cap consideration
  let score = 0;
  
  // Revenue efficiency (primary factor)
  const revenueEfficiency = revenue / amountRaised;
  score += revenueEfficiency * 0.6;
  
  // Market performance (if FDV available)
  if (fdv > 0 && project.lastFundingRoundValuation) {
    const marketPerformance = fdv / project.lastFundingRoundValuation;
    score += Math.log10(marketPerformance + 1) * 0.3;
  }
  
  // Revenue scale bonus
  const revenueScale = Math.log10(revenue + 1) / 10;
  score += revenueScale * 0.1;
  
  return Math.round(score * 100) / 100; // Round to 2 decimal places
} 