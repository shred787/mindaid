import OpenAI from "openai";
import { storage } from "../storage";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "demo_key"
});

interface TaskBreakdownRequest {
  description: string;
  estimatedTime?: number;
  revenueImpact?: number;
}

interface TaskBreakdown {
  subtasks: Array<{
    title: string;
    description: string;
    estimatedMinutes: number;
    priority: number;
  }>;
  totalTime: number;
  recommendations: string[];
}

interface RescheduleRequest {
  reason: string;
  affectedTasks: Array<{
    id: string;
    title: string;
    scheduledStart: string;
    estimatedMinutes: number;
  }>;
}

interface RescheduleResponse {
  suggestions: Array<{
    taskId: string;
    newScheduledStart: string;
    reason: string;
  }>;
  message: string;
}

class OpenAIService {
  async processUserMessage(content: string, userId: string): Promise<{
    content: string;
    metadata?: any;
  }> {
    try {
      // First, check if this message contains a task creation request
      const taskData = await this.extractTaskFromMessage(content);
      let createdTask = null;
      let subtasks = [];

      if (taskData) {
        try {
          if (taskData.isComplex) {
            // For complex tasks, break them down into subtasks
            const breakdown = await this.breakDownTask({
              description: taskData.description,
              estimatedTime: taskData.estimatedMinutes,
              revenueImpact: parseFloat(taskData.revenueImpact || "0")
            });

            // Create parent task
            createdTask = await storage.createTask({
              ...taskData,
              userId: userId,
              title: `${taskData.title} (Project)`,
              description: `${taskData.description}\n\nThis project has been broken down into ${breakdown.subtasks.length} subtasks.`
            });

            // Create subtasks
            for (let i = 0; i < breakdown.subtasks.length; i++) {
              const subtask = breakdown.subtasks[i];
              const subtaskStart = new Date(taskData.scheduledStart);
              subtaskStart.setHours(subtaskStart.getHours() + (i * 2)); // Space subtasks 2 hours apart

              const subtaskEnd = new Date(subtaskStart);
              subtaskEnd.setMinutes(subtaskEnd.getMinutes() + subtask.estimatedMinutes);

              const createdSubtask = await storage.createTask({
                userId: userId,
                title: subtask.title,
                description: subtask.description,
                scheduledStart: subtaskStart,
                scheduledEnd: subtaskEnd,
                estimatedMinutes: subtask.estimatedMinutes,
                priority: subtask.priority,
                revenueImpact: (parseFloat(taskData.revenueImpact || "0") / breakdown.subtasks.length).toString()
              });
              subtasks.push(createdSubtask);
            }
          } else {
            // Simple task - create normally
            createdTask = await storage.createTask({
              ...taskData,
              userId: userId
            });
          }
        } catch (error) {
          console.error("Error creating task:", error);
        }
      }

      // Get recent context
      const recentMessages = await storage.getMessages(userId, 10);
      const todaysTasks = await storage.getTasks(userId, new Date());
      const notifications = await storage.getNotifications(userId, false);

      const systemPrompt = `You are an AI business assistant helping a service business owner manage their tasks and cash flow. You are proactive, helpful, and focused on productivity and revenue optimization.

Context:
- Today's tasks: ${JSON.stringify(todaysTasks.slice(0, 5))}
- Pending notifications: ${notifications.length}
- Recent conversation: ${JSON.stringify(recentMessages.slice(-3))}
${createdTask ? `- Just created task: "${createdTask.title}" scheduled for ${createdTask.scheduledStart}${subtasks.length > 0 ? ` with ${subtasks.length} subtasks` : ''}` : ''}

Guidelines:
- Be concise and actionable
- Focus on task completion and revenue impact
- Suggest specific time blocks and priorities
- Identify urgent items that need immediate attention
- Provide encouragement and accountability
- If you just created a task, acknowledge it and confirm the details
- If the user mentions completing a task, acknowledge it and suggest next steps
- If the user needs help, offer to break down complex tasks
- Always consider the financial impact of recommendations

Respond in a conversational, professional tone as if you're a dedicated personal assistant.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content }
        ],
        max_tokens: 500,
      });

      return {
        content: response.choices[0].message.content || "I'm sorry, I couldn't process that request.",
        metadata: {
          tokens_used: response.usage?.total_tokens,
          model: "gpt-4o",
          createdTask: createdTask?.id || null,
          subtasks: subtasks.map(t => t.id),
          isComplexProject: subtasks.length > 0
        }
      };
    } catch (error) {
      console.error("OpenAI API error:", error);
      return {
        content: "I'm experiencing some technical difficulties. Let me help you in a moment.",
        metadata: { error: true }
      };
    }
  }

  async extractTaskFromMessage(content: string): Promise<any | null> {
    try {
      const extractionPrompt = `Analyze this business message and categorize the task complexity.

Message: "${content}"

SCENARIO CLASSIFICATION:

**SIMPLE TASKS** (single action, <2 hours):
- Individual client calls/meetings
- Single document updates
- One-off administrative tasks
- Quick troubleshooting
- Individual account management
- Basic email responses

**COMPLEX PROJECTS** (multiple phases, >2 hours, affects multiple areas):
- System implementations or migrations
- Multi-client rollouts
- Process overhauls
- Infrastructure changes
- Product launches
- Large-scale reorganizations
- Training programs

**REVENUE-CRITICAL PROJECTS** (high business impact):
- Major client projects ($1000+ value)
- Competitive threats requiring immediate response
- Compliance deadlines
- Crisis management situations
- Time-sensitive opportunities

Respond with JSON:
{
  "isTask": true/false,
  "scenario": "simple"|"complex"|"revenue_critical",
  "title": "Brief task title",
  "description": "Detailed description",
  "scheduledStart": "2025-08-01T14:00:00Z",
  "scheduledEnd": "2025-08-01T15:00:00Z",
  "estimatedMinutes": 60,
  "priority": 1-5 (5=urgent, revenue-critical),
  "revenueImpact": 0,
  "affectedClients": 0 (estimated number),
  "businessContext": "brief reason for priority/complexity"
}

If NOT a task: {"isTask": false}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "user", content: extractionPrompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: 400,
      });

      const result = JSON.parse(response.choices[0].message.content || '{"isTask": false}');
      
      if (result.isTask) {
        const taskData = {
          title: result.title,
          description: result.description,
          scheduledStart: new Date(result.scheduledStart),
          scheduledEnd: new Date(result.scheduledEnd),
          estimatedMinutes: result.estimatedMinutes,
          priority: result.priority,
          revenueImpact: result.revenueImpact?.toString() || "0",
          scenario: result.scenario || "simple",
          isComplex: result.scenario === "complex" || result.scenario === "revenue_critical",
          affectedClients: result.affectedClients || 0,
          businessContext: result.businessContext || ""
        };

        return taskData;
      }

      return null;
    } catch (error) {
      console.error("Error extracting task:", error);
      return null;
    }
  }

  async breakDownTask(request: TaskBreakdownRequest): Promise<TaskBreakdown> {
    try {
      const prompt = `Break down this business task into smaller, manageable subtasks:

Task: ${request.description}
Estimated time: ${request.estimatedTime || 'not specified'} minutes
Revenue impact: $${request.revenueImpact || 'not specified'}

Please provide a JSON response with the following structure:
{
  "subtasks": [
    {
      "title": "Clear, actionable title",
      "description": "Brief description of what needs to be done",
      "estimatedMinutes": number,
      "priority": number (1-5, where 5 is highest)
    }
  ],
  "totalTime": number (sum of all subtask times),
  "recommendations": ["String array of tips for efficient completion"]
}

Focus on:
- Breaking complex tasks into 15-45 minute chunks
- Logical order of completion
- Realistic time estimates
- Revenue-focused prioritization`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const breakdown = JSON.parse(response.choices[0].message.content || "{}");
      return breakdown;
    } catch (error) {
      console.error("Task breakdown error:", error);
      return {
        subtasks: [{
          title: "Complete task",
          description: request.description,
          estimatedMinutes: request.estimatedTime || 60,
          priority: 3,
        }],
        totalTime: request.estimatedTime || 60,
        recommendations: ["Break this task down further when you have more details."],
      };
    }
  }

  async generateReschedule(request: RescheduleRequest): Promise<RescheduleResponse> {
    try {
      const prompt = `A user needs to reschedule tasks due to: ${request.reason}

Affected tasks:
${JSON.stringify(request.affectedTasks, null, 2)}

Please provide a JSON response with rescheduling suggestions:
{
  "suggestions": [
    {
      "taskId": "task_id",
      "newScheduledStart": "ISO timestamp",
      "reason": "explanation for the new timing"
    }
  ],
  "message": "Encouraging message about the reschedule and its impact"
}

Consider:
- Revenue priority (urgent client work first)
- Dependencies between tasks
- Realistic time buffers
- End-of-day energy levels
- Tomorrow's existing schedule`;

      const response = await openai.chat.completions.create({  
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const reschedule = JSON.parse(response.choices[0].message.content || "{}");
      return reschedule;
    } catch (error) {
      console.error("Reschedule generation error:", error);
      return {
        suggestions: [],
        message: "I'll help you reschedule these tasks. Let's prioritize the most important ones first.",
      };
    }
  }

  async challengeTaskCompletion(request: {
    taskTitle: string;
    taskDescription?: string;
    estimatedMinutes?: number;
    priority: number;
    actualMinutes?: number;
  }): Promise<{
    challenge: string;
    questions: string[];
    concerns: string[];
  }> {
    try {
      const timeSpent = request.actualMinutes || 0;
      const estimatedTime = request.estimatedMinutes || 0;
      const timeContext = timeSpent > 0 
        ? `You estimated ${estimatedTime} minutes but only spent ${timeSpent} minutes on it.`
        : `This was estimated to take ${estimatedTime} minutes.`;

      const prompt = `A user is trying to mark a task as complete. As their AI assistant, you need to challenge this decision and ensure they've actually completed it properly.

Task: "${request.taskTitle}"
Priority: ${request.priority}/5
${request.taskDescription ? `Description: "${request.taskDescription}"` : ''}
${timeContext}

Generate a thoughtful challenge that:
1. Questions evidence of completion
2. Asks about quality checks or verification
3. Considers business impact and next steps
4. Maintains accountability without being annoying

Respond with JSON:
{
  "challenge": "A direct question asking for evidence or justification",
  "questions": ["What specific evidence do you have?", "Have you verified quality?", "What's the next step?"],
  "concerns": ["Quality concern", "Business impact concern", "Accountability concern"]
}

Be professional and focus on ensuring work quality and proper completion.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error("Task challenge generation error:", error);
      return {
        challenge: `Can you provide evidence that "${request.taskTitle}" is actually complete?`,
        questions: [
          "What specific work did you complete?",
          "Have you checked the quality of your work?",
          "Is there any documentation or proof of completion?"
        ],
        concerns: [
          "Marking tasks complete without verification can lead to quality issues",
          "Incomplete work may cause problems for clients or team members",
          "Proper accountability requires evidence of actual completion"
        ]
      };
    }
  }

  async challengeProjectCompletion(request: {
    projectTitle: string;
    incompleteSubtasks: Array<{
      title: string;
      priority: number;
      estimatedMinutes: number;
    }>;
    totalSubtasks: number;
    completedSubtasks: number;
  }): Promise<{
    challenge: string;
    questions: string[];
    concerns: string[];
  }> {
    try {
      const prompt = `A user is trying to mark a project as complete when it still has incomplete subtasks. As their AI assistant, you need to challenge this decision professionally and help them think through the implications.

Project: "${request.projectTitle}"
Progress: ${request.completedSubtasks}/${request.totalSubtasks} subtasks completed

Incomplete subtasks:
${request.incompleteSubtasks.map(t => `- ${t.title} (Priority: ${t.priority}/5, ${t.estimatedMinutes}min)`).join('\n')}

Generate a thoughtful challenge that:
1. Questions their reasoning for marking it complete
2. Highlights potential risks or oversights
3. Suggests better alternatives
4. Maintains a supportive but firm tone

Respond with JSON:
{
  "challenge": "A direct, professional challenge question",
  "questions": ["What about X?", "Have you considered Y?", "How will this affect Z?"],
  "concerns": ["Specific concern 1", "Specific concern 2", "Specific concern 3"]
}

Be business-focused and help them make better decisions.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error("Challenge generation error:", error);
      return {
        challenge: "Are you sure you want to mark this project complete with unfinished subtasks?",
        questions: [
          "What's your reasoning for completing this now?",
          "How will the incomplete tasks be handled?",
          "What are the business implications?"
        ],
        concerns: [
          "Incomplete tasks may be forgotten",
          "Project tracking becomes inaccurate",
          "Client deliverables might be missed"
        ]
      };
    }
  }

  async generateCashFlowInsight(userId: string): Promise<{
    insight: string;
    projectedRevenue: number;
    recommendations: string[];
  }> {
    try {
      const tasks = await storage.getTasks(userId);
      const completedTasks = tasks.filter(t => t.completed);
      const pendingTasks = tasks.filter(t => !t.completed);

      const totalRevenue = tasks.reduce((sum, task) => 
        sum + (Number(task.revenueImpact) || 0), 0
      );
      
      const completedRevenue = completedTasks.reduce((sum, task) =>
        sum + (Number(task.revenueImpact) || 0), 0
      );

      const prompt = `Analyze this business data and provide cash flow insights:

Total potential revenue: $${totalRevenue}
Completed revenue: $${completedRevenue}
Pending tasks: ${pendingTasks.length}
Completion rate: ${Math.round((completedTasks.length / tasks.length) * 100)}%

Provide a JSON response:
{
  "insight": "Key insight about current cash flow and productivity",
  "projectedRevenue": number (realistic projection for this period),
  "recommendations": ["Array of actionable recommendations"]
}

Focus on productivity improvements and revenue optimization.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const analysis = JSON.parse(response.choices[0].message.content || "{}");
      return {
        insight: analysis.insight || "Keep up the great work on your tasks!",
        projectedRevenue: analysis.projectedRevenue || totalRevenue,
        recommendations: analysis.recommendations || ["Focus on high-value tasks first"],
      };
    } catch (error) {
      console.error("Cash flow insight error:", error);
      return {
        insight: "Focus on completing your highest-value tasks to maximize revenue.",
        projectedRevenue: 0,
        recommendations: ["Prioritize client work", "Track time accurately", "Follow up on payments"],
      };
    }
  }
}

export const openaiService = new OpenAIService();
