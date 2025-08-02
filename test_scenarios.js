// Test scenarios for complex task detection - General Business
const testScenarios = [
  // SIMPLE TASKS
  {
    input: "Call Sarah about the quarterly budget meeting tomorrow at 2pm",
    expected: "simple",
    description: "Individual client/team call"
  },
  {
    input: "Update the employee handbook with new vacation policy",
    expected: "simple", 
    description: "Single document update"
  },
  {
    input: "Send invoice to Johnson Construction for last month's work",
    expected: "simple",
    description: "One-off administrative task"
  },

  // COMPLEX PROJECTS  
  {
    input: "We need to implement a new customer management system across all departments",
    expected: "complex",
    description: "Multi-department system implementation"
  },
  {
    input: "Launch our new product line with marketing campaign and staff training",
    expected: "complex", 
    description: "Product launch with multiple components"
  },
  {
    input: "Reorganize the entire warehouse operations and inventory system",
    expected: "complex",
    description: "Process overhaul affecting operations"
  },

  // REVENUE-CRITICAL
  {
    input: "Major client threatening to cancel $50K contract - need immediate response",
    expected: "revenue_critical",
    description: "High-value client retention crisis"
  },
  {
    input: "Competitor just launched identical product - we need strategic response by Friday",
    expected: "revenue_critical", 
    description: "Competitive threat with deadline"
  },
  {
    input: "Compliance audit next week - missing documentation could result in penalties",
    expected: "revenue_critical",
    description: "Regulatory compliance deadline"
  }
];

console.log("Updated test scenarios for general business:");
testScenarios.forEach((scenario, i) => {
  console.log(`\n${i+1}. ${scenario.description}`);
  console.log(`   Input: "${scenario.input}"`);
  console.log(`   Expected: ${scenario.expected}`);
});
