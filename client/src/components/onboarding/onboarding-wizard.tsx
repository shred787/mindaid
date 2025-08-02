import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Users, Target, CheckCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

interface OnboardingData {
  businessType: string;
  businessName: string;
  primaryServices: string[];
  goals: string[];
  currentChallenges: string;
  clientTypes: string[];
}

interface OnboardingWizardProps {
  onComplete: () => void;
}

const businessTypes = [
  "Consulting", "Web Development", "Marketing Agency", "Design Studio", 
  "Legal Services", "Accounting", "Real Estate", "Healthcare", 
  "Education", "Construction", "Other"
];

const commonServices = [
  "Strategy Consulting", "Web Development", "Mobile App Development", 
  "Digital Marketing", "SEO", "Content Creation", "Graphic Design", 
  "Photography", "Legal Advice", "Tax Preparation", "Project Management", 
  "Training & Education", "Technical Support"
];

const businessGoals = [
  "Improve Client Satisfaction", "Better Time Management", 
  "Scale Operations", "Reduce Administrative Tasks", "Track Performance", 
  "Better Project Delivery", "Enhance Communication", "Increase Productivity"
];

const clientTypes = [
  "Small Businesses", "Enterprise", "Startups", "Non-profits", 
  "Government", "Individuals", "Other Agencies"
];

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    businessType: "",
    businessName: "",
    primaryServices: [],
    goals: [],
    currentChallenges: "",
    clientTypes: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item) 
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  const handleSubmit = async () => {
    if (!data.businessName || !data.businessType) return;

    setIsSubmitting(true);
    try {
      // Create initial client entries based on business type
      const sampleClients = getSampleClients(data.businessType, data.clientTypes);
      for (const client of sampleClients) {
        await apiRequest("POST", "/api/clients", client);
      }

      // Create initial project template
      const initialProject = {
        title: `${data.businessName} - Getting Started`,
        description: "Initial setup and configuration tasks for your business productivity system",
        clientId: null, // Internal project
        status: "active",
        priority: 3
      };
      
      const project = await apiRequest("POST", "/api/projects", initialProject) as any;

      // Create welcome tasks based on business goals
      const welcomeTasks = getWelcomeTasks(data, project.id);
      for (const task of welcomeTasks) {
        await apiRequest("POST", "/api/tasks", task);
      }

      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      
      onComplete();
    } catch (error) {
      console.error("Onboarding error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6 bg-background text-foreground min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 text-foreground">Welcome to Your Business Assistant</h1>
        <p className="text-muted-foreground">Let's set up your productivity system with real business data</p>
        <div className="flex justify-center space-x-2 mt-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`w-3 h-3 rounded-full ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>
      </div>

      {step === 1 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <Briefcase className="h-5 w-5" />
              Tell us about your business
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              This helps us customize the system for your specific needs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="businessName" className="text-foreground">Business Name *</Label>
              <Input
                id="businessName"
                value={data.businessName}
                onChange={(e) => updateData({ businessName: e.target.value })}
                placeholder="e.g., Smith Consulting LLC"
                className="bg-input border-border text-foreground"
              />
            </div>
            
            <div>
              <Label htmlFor="businessType" className="text-foreground">Business Type *</Label>
              <Select value={data.businessType} onValueChange={(value) => updateData({ businessType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your business type" />
                </SelectTrigger>
                <SelectContent>
                  {businessTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-foreground">Primary Services</Label>
              <p className="text-sm text-muted-foreground mb-2">Select all that apply</p>
              <div className="flex flex-wrap gap-2">
                {commonServices.map(service => (
                  <Badge
                    key={service}
                    variant="outline"
                    className={`cursor-pointer transition-colors ${
                      data.primaryServices.includes(service) 
                        ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700" 
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => updateData({ 
                      primaryServices: toggleArrayItem(data.primaryServices, service) 
                    })}
                  >
                    {service}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <Users className="h-5 w-5" />
              Who are your clients?
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Understanding your client base helps us organize your work better
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-foreground">Client Types</Label>
              <p className="text-sm text-muted-foreground mb-2">Select all that apply</p>
              <div className="flex flex-wrap gap-2">
                {clientTypes.map(type => (
                  <Badge
                    key={type}
                    variant="outline"
                    className={`cursor-pointer transition-colors ${
                      data.clientTypes.includes(type) 
                        ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700" 
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => updateData({ 
                      clientTypes: toggleArrayItem(data.clientTypes, type) 
                    })}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <Target className="h-5 w-5" />
              What are your main goals?
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              We'll help you track progress toward these objectives
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-foreground">Business Goals</Label>
              <p className="text-sm text-muted-foreground mb-2">Select your top priorities</p>
              <div className="flex flex-wrap gap-2">
                {businessGoals.map(goal => (
                  <Badge
                    key={goal}
                    variant="outline"
                    className={`cursor-pointer transition-colors ${
                      data.goals.includes(goal) 
                        ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700" 
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => updateData({ 
                      goals: toggleArrayItem(data.goals, goal) 
                    })}
                  >
                    {goal}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="challenges" className="text-foreground">Current Challenges</Label>
              <Textarea
                id="challenges"
                value={data.currentChallenges}
                onChange={(e) => updateData({ currentChallenges: e.target.value })}
                placeholder="What are the biggest challenges you're facing with productivity, time management, or client work?"
                className="min-h-[100px] bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <CheckCircle className="h-5 w-5" />
              Ready to get started!
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              We'll create your initial workspace with real business data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg border border-border">
              <h3 className="font-medium mb-2 text-foreground">What we'll set up for you:</h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Sample clients based on your business type</li>
                <li>• Initial project structure</li>
                <li>• Getting started tasks tailored to your goals</li>
                <li>• Evidence collection system for accountability</li>
                <li>• Revenue tracking dashboard</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 <strong>Pro tip:</strong> The system requires evidence for ALL task completions. 
                This means screenshots, documents, emails, or detailed descriptions proving work was done. 
                No generic "I did that" responses allowed!
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          className="bg-blue-600 text-white border-blue-600 hover:bg-gray-500 hover:border-gray-500 disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-300"
        >
          Back
        </Button>
        
        {step < 4 ? (
          <Button 
            onClick={() => setStep(step + 1)}
            disabled={step === 1 && (!data.businessName || !data.businessType)}
            className="bg-blue-600 text-white hover:bg-gray-500 disabled:bg-gray-300 disabled:text-gray-500"
          >
            Next
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-green-600 text-white hover:bg-gray-500 disabled:bg-gray-300 disabled:text-gray-500"
          >
            {isSubmitting ? "Setting up..." : "Complete Setup"}
          </Button>
        )}
      </div>
    </div>
  );
}

function getSampleClients(businessType: string, clientTypes: string[]): any[] {
  const clients = [];
  
  if (clientTypes.includes("Small Businesses")) {
    clients.push({
      name: businessType === "Web Development" ? "Local Restaurant Chain" : "Regional Marketing Firm",
      email: "contact@sampleclient1.com",
      phone: "(555) 123-4567",
      importance: 4,
      notes: "Growing business, repeat client, high value projects"
    });
  }
  
  if (clientTypes.includes("Startups")) {
    clients.push({
      name: "TechStart Solutions",
      email: "founders@techstart.com", 
      phone: "(555) 234-5678",
      importance: 5,
      notes: "Early stage startup, equity + cash deal, high growth potential"
    });
  }
  
  if (clientTypes.includes("Enterprise")) {
    clients.push({
      name: "Global Corp Inc",
      email: "procurement@globalcorp.com",
      phone: "(555) 345-6789", 
      importance: 5,
      notes: "Fortune 500 client, large budgets, complex requirements"
    });
  }
  
  return clients;
}

function getWelcomeTasks(data: OnboardingData, projectId: string): any[] {
  const tasks = [];
  const now = new Date();
  
  // Universal setup tasks
  tasks.push({
    projectId,
    title: "Complete Business Profile Setup",
    description: `Verify all business information is accurate: ${data.businessName} (${data.businessType})`,
    priority: 4,
    estimatedMinutes: 15,
    scheduledStart: now,
    scheduledEnd: new Date(now.getTime() + 15 * 60000)
  });
  
  // Goal-specific tasks
  if (data.goals.includes("Increase Productivity")) {
    tasks.push({
      projectId,
      title: "Focus on High-Value Tasks",
      description: "Identify and prioritize tasks that directly contribute to business growth and client satisfaction",
      priority: 3,
      estimatedMinutes: 30,
      scheduledStart: new Date(now.getTime() + 20 * 60000),
      scheduledEnd: new Date(now.getTime() + 50 * 60000)
    });
  }
  
  if (data.goals.includes("Better Time Management")) {
    tasks.push({
      projectId,
      title: "Test Evidence Collection System",
      description: "Complete this task using the evidence system - take a screenshot of your completed business profile",
      priority: 3,
      estimatedMinutes: 10,
      scheduledStart: new Date(now.getTime() + 60 * 60000),
      scheduledEnd: new Date(now.getTime() + 70 * 60000)
    });
  }
  
  if (data.goals.includes("Improve Client Satisfaction")) {
    tasks.push({
      projectId,
      title: "Review Client Communication Workflow",
      description: "Document your current client communication process and identify improvement opportunities",
      priority: 2,
      estimatedMinutes: 45,
      scheduledStart: new Date(now.getTime() + 80 * 60000),
      scheduledEnd: new Date(now.getTime() + 125 * 60000)
    });
  }
  
  return tasks;
}