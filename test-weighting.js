// Test script to demonstrate weighted revenue calculation differences

// Example projects with different revenue mixes
const testProjects = [
  {
    name: "Hyperliquid-like (High Direct Revenue)",
    annualizedRevenue: 800000000,     // $800M direct revenue
    annualizedAppFees: 50000000,      // $50M ecosystem revenue  
    amountRaised: 0                   // Bootstrapped
  },
  {
    name: "Berachain-like (High Ecosystem Revenue)",
    annualizedRevenue: 10000000,      // $10M direct revenue
    annualizedAppFees: 500000000,     // $500M ecosystem revenue
    amountRaised: 200000000           // $200M raised
  },
  {
    name: "Balanced Project",
    annualizedRevenue: 100000000,     // $100M direct revenue
    annualizedAppFees: 100000000,     // $100M ecosystem revenue
    amountRaised: 150000000           // $150M raised
  }
];

// Weighting constants
const trueRevenueWeight = 1.0;
const ecosystemRevenueWeight = 0.6;

function calculateRevenue(project, useWeighting = true) {
  const weights = useWeighting ? 
    { true: trueRevenueWeight, ecosystem: ecosystemRevenueWeight } :
    { true: 1.0, ecosystem: 1.0 };
    
  return (project.annualizedRevenue * weights.true) + (project.annualizedAppFees * weights.ecosystem);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

console.log("🔍 WEIGHTED REVENUE SYSTEM TEST\n");
console.log("True Revenue Weight:", trueRevenueWeight, "(100%)");
console.log("Ecosystem Revenue Weight:", ecosystemRevenueWeight, "(60%)\n");

testProjects.forEach(project => {
  const unweightedRevenue = calculateRevenue(project, false);
  const weightedRevenue = calculateRevenue(project, true);
  const difference = unweightedRevenue - weightedRevenue;
  const percentChange = ((weightedRevenue - unweightedRevenue) / unweightedRevenue * 100);
  
  console.log(`📊 ${project.name}`);
  console.log(`   Direct Revenue: ${formatCurrency(project.annualizedRevenue)}`);
  console.log(`   Ecosystem Revenue: ${formatCurrency(project.annualizedAppFees)}`);
  console.log(`   Unweighted Total: ${formatCurrency(unweightedRevenue)}`);
  console.log(`   Weighted Total: ${formatCurrency(weightedRevenue)}`);
  console.log(`   Difference: ${formatCurrency(difference)} (${percentChange.toFixed(1)}%)`);
  
  if (project.amountRaised > 0) {
    const unweightedRatio = unweightedRevenue / project.amountRaised;
    const weightedRatio = weightedRevenue / project.amountRaised;
    console.log(`   Revenue/Funding Ratio: ${weightedRatio.toFixed(2)}x (vs ${unweightedRatio.toFixed(2)}x unweighted)`);
  }
  console.log("");
});

console.log("💡 KEY INSIGHT:");
console.log("Projects with high direct revenue (like Hyperliquid) maintain their advantage");
console.log("Projects dependent on ecosystem revenue (like Berachain) get penalized");
console.log("This better reflects the true value and control each protocol has over revenue");
