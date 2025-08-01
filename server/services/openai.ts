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
      // Get recent context
      const recentMessages = await storage.getMessages(userId, 10);
      const todaysTasks = await storage.getTasks(userId, new Date());
      const notifications = await storage.getNotifications(userId, false);

      const systemPrompt = `You are an AI business assistant helping a service business owner manage their tasks and cash flow. You are proactive, helpful, and focused on productivity and revenue optimization.

Context:
- Today's tasks: ${JSON.stringify(todaysTasks.slice(0, 5))}
- Pending notifications: ${notifications.length}
- Recent conversation: ${JSON.stringify(recentMessages.slice(-3))}

Guidelines:
- Be concise and actionable
- Focus on task completion and revenue impact
- Suggest specific time blocks and priorities
- Identify urgent items that need immediate attention
- Provide encouragement and accountability
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
          model: "gpt-4o"
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
