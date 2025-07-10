import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Aura Score API Documentation',
  description: 'Complete API documentation for integrating Aura Score data into your applications',
};

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Aura Score API Documentation
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Access comprehensive crypto project data, rankings, and Aura Scores through our RESTful API. 
            Perfect for building analytics tools, dashboards, and research applications.
          </p>
        </div>

        {/* Quick Start */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Quick Start</h2>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">Base URL</h3>
                <code className="bg-gray-100 px-4 py-2 rounded text-sm block">
                  https://maxxing.aura.money/api/v1
                </code>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">Authentication</h3>
                <p className="text-gray-600">
                  Currently public access. API keys coming soon for higher rate limits.
                </p>
              </div>
            </div>
            
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Example Request</h3>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
                <pre>{`curl "https://maxxing.aura.money/api/v1/projects?limit=10" \\
  -H "Content-Type: application/json"`}</pre>
              </div>
            </div>
          </div>
        </section>

        {/* Endpoints */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">API Endpoints</h2>
          
          {/* Projects Endpoint */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex items-center mb-6">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mr-4">
                GET
              </span>
              <h3 className="text-2xl font-bold">/projects</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Get a list of all projects with their Aura Scores, revenue data, and market metrics.
            </p>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold mb-3">Query Parameters</h4>
                <div className="space-y-2 text-sm">
                  <div><code className="bg-gray-100 px-2 py-1 rounded">category</code> - Filter by category (L1, L2, Application, Stablecoins)</div>
                  <div><code className="bg-gray-100 px-2 py-1 rounded">sort</code> - Sort by metric (auraScore, annualizedRevenue, fdv)</div>
                  <div><code className="bg-gray-100 px-2 py-1 rounded">limit</code> - Number of results (default: 50, max: 100)</div>
                  <div><code className="bg-gray-100 px-2 py-1 rounded">offset</code> - Pagination offset (default: 0)</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Example Response</h4>
                <div className="bg-gray-900 text-green-400 p-4 rounded text-xs overflow-x-auto">
                  <pre>{`{
  "data": [
    {
      "name": "Hyperliquid",
      "category": "L1",
      "auraScore": 1247.23,
      "auraRank": 1,
      "annualizedRevenue": 786710173,
      "fdv": 41004093602,
      "currentPrice": 41.00,
      "amountRaised": 0,
      "returnSinceTGE": 976.22
    }
  ],
  "meta": {
    "total": 26,
    "limit": 50,
    "offset": 0,
    "responseTime": 245
  }
}`}</pre>
                </div>
              </div>
            </div>
          </div>

          {/* Individual Project Endpoint */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex items-center mb-6">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mr-4">
                GET
              </span>
              <h3 className="text-2xl font-bold">/projects/[slug]</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Get detailed information about a specific project, including insights, competitors, and performance metrics.
            </p>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold mb-3">Path Parameters</h4>
                <div className="space-y-2 text-sm">
                  <div><code className="bg-gray-100 px-2 py-1 rounded">slug</code> - Project name or slug (e.g., "hyperliquid", "pump-fun")</div>
                </div>
                
                <h4 className="font-semibold mb-3 mt-6">Example URLs</h4>
                <div className="space-y-1 text-sm">
                  <div><code className="text-blue-600">/api/v1/projects/hyperliquid</code></div>
                  <div><code className="text-blue-600">/api/v1/projects/pump-fun</code></div>
                  <div><code className="text-blue-600">/api/v1/projects/ethereum</code></div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Enhanced Data</h4>
                <div className="space-y-2 text-sm">
                  <div>• Detailed project insights and analysis</div>
                  <div>• Category rankings and percentiles</div>
                  <div>• Top 5 competitors in same category</div>
                  <div>• Performance metrics and trends</div>
                  <div>• Funding efficiency calculations</div>
                </div>
              </div>
            </div>
          </div>

          {/* Rankings Endpoint */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex items-center mb-6">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mr-4">
                GET
              </span>
              <h3 className="text-2xl font-bold">/rankings</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Get leaderboard data with multiple ranking metrics and optional insights.
            </p>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold mb-3">Query Parameters</h4>
                <div className="space-y-2 text-sm">
                  <div><code className="bg-gray-100 px-2 py-1 rounded">metric</code> - Ranking metric (auraScore, revenue, efficiency, marketCap, funding, performance)</div>
                  <div><code className="bg-gray-100 px-2 py-1 rounded">category</code> - Filter by category</div>
                  <div><code className="bg-gray-100 px-2 py-1 rounded">limit</code> - Number of results (default: 25)</div>
                  <div><code className="bg-gray-100 px-2 py-1 rounded">insights</code> - Include insights (true/false)</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Available Metrics</h4>
                <div className="space-y-1 text-sm">
                  <div><strong>auraScore</strong> - Overall Aura Score ranking</div>
                  <div><strong>revenue</strong> - Annualized revenue ranking</div>
                  <div><strong>efficiency</strong> - Revenue efficiency ranking</div>
                  <div><strong>marketCap</strong> - Market capitalization ranking</div>
                  <div><strong>funding</strong> - Amount raised ranking</div>
                  <div><strong>performance</strong> - Token performance ranking</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Rate Limits */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Rate Limits</h2>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">100</div>
                <div className="text-gray-600">Requests per minute</div>
                <div className="text-sm text-gray-500 mt-2">/projects endpoint</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">200</div>
                <div className="text-gray-600">Requests per minute</div>
                <div className="text-sm text-gray-500 mt-2">/projects/[slug] endpoint</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">150</div>
                <div className="text-gray-600">Requests per minute</div>
                <div className="text-sm text-gray-500 mt-2">/rankings endpoint</div>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">
                <strong>Coming Soon:</strong> API keys for authenticated access with higher rate limits and usage analytics.
              </p>
            </div>
          </div>
        </section>

        {/* Data Schema */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Data Schema</h2>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-xl font-semibold mb-4">Project Object</h3>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
              <pre>{`{
  "name": "string",              // Project name
  "category": "string",          // L1, L2, Application, Stablecoins
  "auraScore": "number",         // Calculated Aura Score
  "auraRank": "number",          // Overall ranking
  "annualizedRevenue": "number", // Annual revenue in USD
  "amountRaised": "number",      // Total funding raised
  "fdv": "number",              // Fully diluted valuation
  "currentPrice": "number",      // Current token price
  "tgePrice": "number",         // Token generation event price
  "returnSinceTGE": "number",   // % return since TGE
  "returnVsFunding": "number",   // % return vs funding valuation
  "lastFundingRoundValuation": "number", // Last funding round valuation
  "ecosystemRevenue": "number", // Ecosystem-wide revenue
  "appFees": "number"           // Application fees
}`}</pre>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Use Cases</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Portfolio Analytics</h3>
              <p className="text-gray-600">
                Build portfolio tracking tools that incorporate Aura Scores for better investment insights.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Research Platforms</h3>
              <p className="text-gray-600">
                Integrate comprehensive project data into research and analysis platforms.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Trading Bots</h3>
              <p className="text-gray-600">
                Use Aura Score data and rankings to inform algorithmic trading strategies.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Market Dashboards</h3>
              <p className="text-gray-600">
                Create custom dashboards with real-time project rankings and metrics.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Due Diligence</h3>
              <p className="text-gray-600">
                Access standardized metrics for investment due diligence and comparison.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Academic Research</h3>
              <p className="text-gray-600">
                Use structured data for academic research on crypto project performance.
              </p>
            </div>
          </div>
        </section>

        {/* Support */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Support & Community</h2>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">Getting Help</h3>
                <div className="space-y-3">
                  <p className="text-gray-600">
                    Join our developer community for support, feature requests, and discussions.
                  </p>
                  <div className="space-y-2">
                    <div>📧 Email: api@aura.money</div>
                    <div>💬 Discord: #api-developers</div>
                    <div>🐛 Issues: GitHub repository</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-4">Roadmap</h3>
                <div className="space-y-2 text-gray-600">
                  <div>✅ Public API access</div>
                  <div>🔄 API key authentication</div>
                  <div>🔄 Webhook notifications</div>
                  <div>🔄 Historical data endpoints</div>
                  <div>🔄 Real-time WebSocket feeds</div>
                  <div>🔄 SDK libraries (JS, Python, Go)</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
} 