// Test scenarios for complex task detection
const testScenarios = [
  // SIMPLE TASKS
  {
    input: "Call John about his billing issue tomorrow at 2pm",
    expected: "simple",
    description: "Individual client call"
  },
  {
    input: "Restart the mail server this evening",
    expected: "simple", 
    description: "Single server action"
  },
  {
    input: "Update Sarah's hosting account password",
    expected: "simple",
    description: "One-off account change"
  },

  // COMPLEX PROJECTS  
  {
    input: "We need to migrate all our client websites from the old server to the new hosting platform",
    expected: "complex",
    description: "Multi-client migration project"
  },
  {
    input: "Set up the new email hosting service for all business clients",
    expected: "complex", 
    description: "New service rollout"
  },
  {
    input: "Upgrade our entire network infrastructure to support higher bandwidth",
    expected: "complex",
    description: "Infrastructure overhaul"
  },

  // REVENUE-CRITICAL
  {
    input: "The main server is down and affecting 50+ client websites - need immediate action",
    expected: "revenue_critical",
    description: "Service outage emergency"
  },
  {
    input: "Major enterprise client wants to onboard 100 domains by Friday or they'll go with competitor",
    expected: "revenue_critical", 
    description: "High-value competitive threat"
  },
  {
    input: "Implement SSL certificates for all client sites to meet new compliance requirements",
    expected: "revenue_critical",
    description: "Compliance deadline"
  }
];

console.log("Test scenarios ready for validation:");
testScenarios.forEach((scenario, i) => {
  console.log(`\n${i+1}. ${scenario.description}`);
  console.log(`   Input: "${scenario.input}"`);
  console.log(`   Expected: ${scenario.expected}`);
});
