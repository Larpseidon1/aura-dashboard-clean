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
  { name: 'Phantom', category: 'Application', amountRaised: 268_000_000, useDefillama: true }
];

// API configuration
export const runtime = 'nodejs';
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

// Cache for API responses
let cachedData: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// API key validation
function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key') || request.nextUrl.searchParams.get('api_key');
  return true; // Public access for now
}

// Rate limiting
const rateLimitMap = new Map();
function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 200; // Higher limit for individual project queries
  
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

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
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
        { error: 'Rate limit exceeded. Maximum 200 requests per minute.' },
        { status: 429 }
      );
    }
    
    const { slug } = params;
    
    // Check cache
    const now = Date.now();
    if (cachedData && (now - cacheTimestamp) < CACHE_DURATION) {
      const project = findProjectInCache(cachedData, slug);
      if (project) {
        return NextResponse.json({
          data: project,
          meta: {
            cached: true,
            cacheAge: Math.floor((now - cacheTimestamp) / 1000),
            lastUpdated: new Date(cacheTimestamp).toISOString()
          },
          api: {
            version: '1.0',
            endpoint: `/api/v1/projects/${slug}`
          }
        });
      }
    }
    
    // Fetch fresh data
    console.log(`🔄 API: Fetching project data for ${slug}...`);
    const startTime = Date.now();
    
    const enrichedProjects = await enrichAllProjects(BASE_PROJECTS);
    
    // Calculate Aura Scores and find the specific project
    const projectsWithScores = enrichedProjects.map((project: any) => {
      const auraScore = calculateAuraScore(project);
      return {
        ...project,
        auraScore
      };
    });
    
    // Sort by Aura Score to get rankings
    projectsWithScores.sort((a, b) => b.auraScore - a.auraScore);
    
    // Add rankings and find target project
    let targetProject = null;
    projectsWithScores.forEach((project, index) => {
      project.auraRank = index + 1;
      
      // Match by name (case-insensitive, with slug normalization)
      const projectSlug = project.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const searchSlug = slug.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      if (projectSlug === searchSlug || project.name.toLowerCase() === slug.toLowerCase()) {
        targetProject = project;
      }
    });
    
    if (!targetProject) {
      return NextResponse.json(
        { 
          error: 'Project not found',
          message: `No project found with identifier: ${slug}`,
          suggestion: 'Try using the exact project name or check /api/v1/projects for available projects'
        },
        { status: 404 }
      );
    }
    
    const responseTime = Date.now() - startTime;
    
    // Cache the full dataset for future lookups
    cachedData = projectsWithScores;
    cacheTimestamp = now;
    
    // Enhanced project data with additional insights
    const enhancedProject = {
      ...(targetProject as any),
      insights: generateProjectInsights(targetProject, projectsWithScores),
      competitors: findCompetitors(targetProject, projectsWithScores),
      performance: calculatePerformanceMetrics(targetProject)
    };
    
    console.log(`✅ API: Found project ${(targetProject as any).name} in ${responseTime}ms`);
    
    return NextResponse.json({
      data: enhancedProject,
      meta: {
        responseTime,
        lastUpdated: new Date().toISOString(),
        cached: false,
        totalProjects: projectsWithScores.length
      },
      api: {
        version: '1.0',
        endpoint: `/api/v1/projects/${slug}`,
        rateLimit: {
          limit: 200,
          remaining: 200 - (rateLimitMap.get(clientId)?.count || 1)
        }
      }
    });
    
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

// Helper functions
function findProjectInCache(cachedProjects: any[], slug: string): any {
  return cachedProjects.find(project => {
    const projectSlug = project.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const searchSlug = slug.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return projectSlug === searchSlug || project.name.toLowerCase() === slug.toLowerCase();
  });
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

function generateProjectInsights(project: any, allProjects: any[]): any {
  const categoryProjects = allProjects.filter(p => p.category === project.category);
  const categoryRank = categoryProjects.findIndex(p => p.name === project.name) + 1;
  
  return {
    categoryRank,
    categoryTotal: categoryProjects.length,
    revenueEfficiency: project.annualizedRevenue / (project.amountRaised || 1),
    isTopPerformer: project.auraRank <= 10,
    performanceLevel: project.auraRank <= 5 ? 'exceptional' : 
                     project.auraRank <= 15 ? 'excellent' : 
                     project.auraRank <= 30 ? 'good' : 'developing'
  };
}

function findCompetitors(project: any, allProjects: any[]): any[] {
  return allProjects
    .filter(p => p.category === project.category && p.name !== project.name)
    .slice(0, 5)
    .map(p => ({
      name: p.name,
      auraScore: p.auraScore,
      auraRank: p.auraRank,
      annualizedRevenue: p.annualizedRevenue
    }));
}

function calculatePerformanceMetrics(project: any): any {
  const metrics: any = {
    revenueGrowthPotential: 'unknown',
    marketPosition: 'unknown',
    fundingEfficiency: 'unknown'
  };
  
  if (project.annualizedRevenue && project.amountRaised) {
    const efficiency = project.annualizedRevenue / project.amountRaised;
    metrics.fundingEfficiency = efficiency > 10 ? 'excellent' : 
                               efficiency > 2 ? 'good' : 
                               efficiency > 0.5 ? 'fair' : 'poor';
  }
  
  if (project.fdv && project.lastFundingRoundValuation) {
    const marketGrowth = project.fdv / project.lastFundingRoundValuation;
    metrics.marketPosition = marketGrowth > 2 ? 'strong' : 
                            marketGrowth > 1 ? 'stable' : 'declining';
  }
  
  return metrics;
} 