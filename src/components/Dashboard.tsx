'use client';

import { useState, useEffect, useRef } from 'react';
import { HeroHeader } from './HeroHeader';
import { Header } from './Header';
import { RevenueChart } from './RevenueChart';
import { StatsCards } from './StatsCards';
import { BuilderLeaderboard } from './BuilderLeaderboard';
import { InfrastructureComparison } from './InfrastructureComparison';
import { LoadingSpinner } from './LoadingSpinner';
import { Footer } from './Footer';
import { DashboardData, TimeRange } from '@/types';
import Image from 'next/image';

interface CryptoProject {
  name: string;
  category: 'L1' | 'L2' | 'L3' | 'Application' | 'dApp' | 'Stablecoins';
  secondaryCategory?: string;
  amountRaised: number;
  dailyRevenue?: number;
  dailyAppFees?: number;
  annualizedRevenue?: number;
  annualizedAppFees?: number;
  ecosystemRevenue?: number;
}

interface ProjectWithAuraScore extends CryptoProject {
  auraScore: number;
}

export function Dashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange['value']>('all');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [auraRanks, setAuraRanks] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backgroundsReady, setBackgroundsReady] = useState(false);
  const [shouldPreserveScroll, setShouldPreserveScroll] = useState(false);
  const savedScrollPosition = useRef<number>(0);
  
  // Debug state to track what's happening
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // Check if sky images are already loaded (from loading screen)
  useEffect(() => {
    // Small delay to allow loading screen preloading to complete
    const timer = setTimeout(() => {
      setBackgroundsReady(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Enhanced timeRange change handler with scroll preservation
  const handleTimeRangeChange = (newTimeRange: TimeRange['value']) => {
    // Save current scroll position
    savedScrollPosition.current = window.scrollY;
    setShouldPreserveScroll(true);
    setTimeRange(newTimeRange);
  };

  // Restore scroll position after content updates
  useEffect(() => {
    if (shouldPreserveScroll && !dataLoading && dashboardData) {
      // Use multiple methods to ensure scroll restoration works
      const restoreScroll = () => {
        const targetY = savedScrollPosition.current;
        
        // Method 1: Direct scroll
        window.scrollTo(0, targetY);
        
        // Method 2: Smooth scroll as backup
        setTimeout(() => {
          window.scrollTo({
            top: targetY,
            behavior: 'instant'
          });
        }, 50);
        
        // Method 3: Force scroll with longer delay
        setTimeout(() => {
          if (Math.abs(window.scrollY - targetY) > 10) {
            window.scrollTo(0, targetY);
          }
        }, 100);
      };

      // Restore scroll after a brief delay to ensure content is rendered
      setTimeout(restoreScroll, 0);
      setShouldPreserveScroll(false);
    }
  }, [shouldPreserveScroll, dataLoading, dashboardData]);

  // Calculate aura score for a project (same logic as InfrastructureComparison)
  const calculateAuraScore = (project: CryptoProject): ProjectWithAuraScore => {
    const annualizedRevenue = project.annualizedRevenue || 0;
    const annualizedAppFees = project.annualizedAppFees || 0;
    const amountRaised = project.amountRaised;

    // Calculate weighted revenue based on project type
    let weightedAnnualRevenue = 0;
    
    if (project.category === 'Application' || project.category === 'dApp' || project.category === 'Stablecoins') {
      // Apps: 100% weight for native revenue (they generate their own fees directly)
      weightedAnnualRevenue = annualizedRevenue * 1.0;
    } else {
      // L1/L2/L3 Infrastructure: Native revenue gets 100% weight, ecosystem fees get 70% weight
      // This favors projects that generate revenue themselves vs just collecting from ecosystem
      const nativeRevenue = annualizedRevenue * 1.0;        // 100% weight for direct chain revenue
      const ecosystemRevenueWeighted = (project.ecosystemRevenue || 0) * 0.7;      // 70% weight for ecosystem app fees
      weightedAnnualRevenue = nativeRevenue + ecosystemRevenueWeighted;
    }

    let auraScore = 0;

    if (amountRaised === 0) {
      // Bootstrapped projects - if they have revenue, they get max positive aura (meme infinity)
      if (weightedAnnualRevenue > 0) {
        auraScore = Infinity;
      } else {
        auraScore = 0;
      }
    } else {
      // Calculate a dramatic aura score for funded projects using weighted revenue
      const rawRatio = weightedAnnualRevenue / amountRaised;
      
      if (rawRatio <= 0) {
        // No revenue = ultra cursed aura 
        auraScore = -1000;
      } else if (rawRatio < 0.001) {
        // Extremely low revenue = deeply cursed aura
        auraScore = Math.log10(rawRatio * 1000) * 200 - 800; // Results in -800 to -200 range
      } else if (rawRatio < 0.01) {
        // Very low revenue = cursed to weak aura
        auraScore = Math.log10(rawRatio * 100) * 150 - 200; // Results in -200 to 100 range
      } else if (rawRatio < 0.1) {
        // Low revenue = weak to decent aura
        auraScore = Math.log10(rawRatio * 10) * 200 + 200; // Results in 0-400 range
      } else if (rawRatio < 1) {
        // Medium revenue = solid aura
        auraScore = Math.log10(rawRatio) * 300 + 700; // Results in 400-700 range
      } else if (rawRatio < 10) {
        // High revenue = powerful aura
        auraScore = Math.log2(rawRatio) * 400 + 700; // Results in 700-2000 range
      } else if (rawRatio < 100) {
        // Very high revenue = legendary aura
        auraScore = Math.log2(rawRatio / 10) * 600 + 2000; // Results in 2000-5000 range
      } else {
        // Insane revenue = godlike aura (but not infinite)
        auraScore = Math.log2(rawRatio / 100) * 1000 + 5000; // Results in 5000+ range
      }
      
      // Round to whole numbers for dramatic impact
      auraScore = Math.round(auraScore);
    }

    return {
      ...project,
      auraScore
    };
  };

  // Simple test useEffect to see if it runs at all
  useEffect(() => {
    console.log('🧪 Test useEffect is running!');
    setDebugInfo(['🧪 Test useEffect ran on mount']);
  }, []);

  // Automatic data loading with debug tracking
  useEffect(() => {
    async function fetchData() {
      setDebugInfo(prev => [...prev, '🚀 Starting auto-load...']);
      
      // Only show full loading spinner on initial load
      if (!dashboardData) {
        setLoading(true);
      } else {
        setDataLoading(true); // Show smaller loading indicator for timeframe changes
      }
      setError(null);
      
      try {
        setDebugInfo(prev => [...prev, '📡 Fetching APIs...']);
        
        // Fetch both builder revenue data and aura comparison data
        const [revenueResponse, comparisonResponse] = await Promise.all([
          fetch(`/api/builders/revenue?timeRange=${timeRange}`),
          fetch('/api/comparison')
        ]);
        
        setDebugInfo(prev => [...prev, `📊 API Status: Revenue ${revenueResponse.status}, Comparison ${comparisonResponse.status}`]);
        
        if (!revenueResponse.ok) {
          throw new Error('Failed to fetch revenue data');
        }
        if (!comparisonResponse.ok) {
          throw new Error('Failed to fetch comparison data');
        }
        
        const revenueData = await revenueResponse.json();
        const comparisonData = await comparisonResponse.json();
        
        setDebugInfo(prev => [...prev, `📈 Data: ${revenueData?.builders?.length || 0} builders, ${comparisonData?.projects?.length || 0} projects`]);
        
        setDashboardData(revenueData);
        
        // Create mapping from project names to aura ranks
        const ranks: Record<string, number> = {};
        if (comparisonData.projects) {
          // Calculate aura scores for all projects first
          const projectsWithAura = comparisonData.projects.map(calculateAuraScore);
          
          // Sort projects by aura score (descending) to get proper rankings
          const sortedProjects = projectsWithAura.sort((a: ProjectWithAuraScore, b: ProjectWithAuraScore) => {
            // Sort by aura score (descending), with Infinity (bootstrapped with revenue) at top
            if (a.auraScore === Infinity && b.auraScore === Infinity) return 0;
            if (a.auraScore === Infinity) return -1;
            if (b.auraScore === Infinity) return 1;
            return b.auraScore - a.auraScore;
          });
          
          // Assign ranks based on sorted order
          sortedProjects.forEach((project: ProjectWithAuraScore, index: number) => {
            ranks[project.name] = index + 1;
          });
        }
        setAuraRanks(ranks);
        
        setDebugInfo(prev => [...prev, '✅ Loading completed successfully!']);
        
      } catch (err: any) {
        const errorMsg = `❌ Error: ${err.message}`;
        setDebugInfo(prev => [...prev, errorMsg]);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
        setDataLoading(false);
      }
    }

    fetchData();
  }, [timeRange]);

  // Manual loading function (keep as backup/retry)
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🚀 Manual data loading started...');
      
      // Fetch both builder revenue data and aura comparison data
      const [revenueResponse, comparisonResponse] = await Promise.all([
        fetch(`/api/builders/revenue?timeRange=${timeRange}`),
        fetch('/api/comparison')
      ]);
      
      console.log('📡 API responses:', {
        revenue: revenueResponse.status,
        comparison: comparisonResponse.status
      });
      
      if (!revenueResponse.ok) {
        throw new Error('Failed to fetch revenue data');
      }
      if (!comparisonResponse.ok) {
        throw new Error('Failed to fetch comparison data');
      }
      
      const revenueData = await revenueResponse.json();
      const comparisonData = await comparisonResponse.json();
      
      console.log('📊 Data received:', {
        builders: revenueData?.builders?.length,
        projects: comparisonData?.projects?.length
      });
      
      setDashboardData(revenueData);
      
      // Create mapping from project names to aura ranks
      const ranks: Record<string, number> = {};
      if (comparisonData.projects) {
        // Calculate aura scores for all projects first
        const projectsWithAura = comparisonData.projects.map(calculateAuraScore);
        
        // Sort projects by aura score (descending) to get proper rankings
        const sortedProjects = projectsWithAura.sort((a: ProjectWithAuraScore, b: ProjectWithAuraScore) => {
          // Sort by aura score (descending), with Infinity (bootstrapped with revenue) at top
          if (a.auraScore === Infinity && b.auraScore === Infinity) return 0;
          if (a.auraScore === Infinity) return -1;
          if (b.auraScore === Infinity) return 1;
          return b.auraScore - a.auraScore;
        });
        
        // Assign ranks based on sorted order
        sortedProjects.forEach((project: ProjectWithAuraScore, index: number) => {
          ranks[project.name] = index + 1;
        });
      }
      setAuraRanks(ranks);
      
      console.log('✅ Data loading completed successfully!');
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
      setDataLoading(false);
    }
  };



  // Only show full loading spinner on initial load
  if (loading && !dashboardData) {
    return <LoadingSpinner variant="sky" />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-lg mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

    // Add explicit check for dashboardData
  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-gray-500 text-lg mb-4">No dashboard data available</div>
          
          {/* Debug Information */}
          <div className="bg-gray-100 p-4 rounded-lg mb-4 text-left text-sm">
            <div className="font-semibold mb-2">Debug Info:</div>
            {debugInfo.length > 0 ? (
              debugInfo.map((info, i) => (
                <div key={i} className="mb-1">{info}</div>
              ))
            ) : (
              <div>No debug info yet...</div>
            )}
          </div>
          
          <button 
            onClick={loadData} 
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  // Check if we have real data for pvp.trade
  const hasRealData = dashboardData.builders.some(builder => 
    builder.builderCode === 'PVP001' && builder.builderName === 'pvp.trade'
  );

  return (
    <>
      {/* Enhanced gradient background with animated texture - loads instantly */}
      <div className="fixed inset-0 z-0 sky-gradient-base sky-texture hidden sm:block" />
      
      {/* Mobile Background - removed, using solid white instead */}
      
      {/* Desktop Background - smooth transition when ready */}
      <div 
        className={`hidden md:block fixed inset-0 z-0 transition-opacity duration-1000 ${
          backgroundsReady ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          backgroundImage: 'url(/sky-4k.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'scroll',
        }}
      />

      {/* Data Loading Overlay - shown during timeframe changes */}
      {dataLoading && (
        <div className="fixed top-4 right-4 z-50 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full border-2 border-gray-300 border-t-blue-500 h-5 w-5"></div>
            <span className="text-sm font-medium text-gray-700">Updating data...</span>
          </div>
        </div>
      )}
      
      {/* Main Content Container - Edge to edge on mobile */}
      <div className="relative z-10 min-h-screen bg-white sm:bg-transparent px-0 sm:px-8 py-0 sm:py-4">
        {/* Mobile Logo - Only visible on mobile */}
        <div className="block sm:hidden bg-white border-b border-gray-100 px-4 py-4">
          <div className="flex justify-center">
            <Image
              src="/logo-full-horizontal.svg"
              alt="Aura Logo"
              width={180}
              height={54}
              className="h-12 w-auto"
              priority
            />
          </div>
        </div>

        {/* Hero Header */}
        <div className="hidden sm:block">
          <HeroHeader />
        </div>
        
        {/* Main content - Solid white on mobile, glass effect on desktop */}
        <div className="min-h-screen bg-white sm:min-h-[calc(100vh-2rem)] sm:rounded-lg sm:backdrop-blur-sm sm:bg-white/50">
          <div className="container mx-auto max-w-6xl px-0 sm:px-8 py-0 sm:py-8">

          
          {/* Aura Score Section - Above header stats */}
          <div className="mb-6 sm:mb-8">
            <InfrastructureComparison />
          </div>

          <div className={`transition-opacity duration-300 ${dataLoading ? 'opacity-70' : 'opacity-100'}`}>
            <Header 
              data={dashboardData}
              timeRange={timeRange}
              onTimeRangeChange={handleTimeRangeChange}
              isLoading={dataLoading}
            />
            
            <div className="mt-6 sm:mt-8">
              <RevenueChart 
                data={dashboardData}
                timeRange={timeRange}
              />
            </div>
            
            <div className="mt-6 sm:mt-8">
              <StatsCards data={dashboardData} />
            </div>
            
            <div className="mt-6 sm:mt-8">
              <BuilderLeaderboard builders={dashboardData.builders} auraRanks={auraRanks} />
            </div>
          </div>
          </div>
        </div>
        
        {/* Footer */}
        <Footer />
      </div>
    </>
  );
}