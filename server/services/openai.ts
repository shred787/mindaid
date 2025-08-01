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
      const extractionPrompt = `Analyze this message from an ISP business owner and determine the task creation approach needed.

Message: "${content}"

Analyze for:
1. Simple task: Single action item
2. Complex project: Multiple phases, dependencies, or technical components

Respond with JSON in this exact format:
{
  "isTask": true/false,
  "isComplex": true/false (if task involves multiple steps, technical implementation, or business processes),
  "title": "Brief task title",
  "description": "Detailed description", 
  "scheduledStart": "2025-08-01T14:00:00Z" (ISO format, best guess for date/time),
  "scheduledEnd": "2025-08-01T15:00:00Z" (ISO format, estimated end time),
  "estimatedMinutes": 60,
  "priority": 3 (1-5 scale),
  "revenueImpact": 0 (estimated dollar amount),
  "complexityIndicators": ["list", "of", "reasons", "if", "complex"]
}

Complex task indicators for ISP business:
- Migration, implementation, rollout, overhaul, upgrade
- Multiple clients/systems affected
- Technical + business components
- Phrases like "set up new", "migrate all", "complete system", "full implementation"
- Multi-step processes (testing, deployment, client communication)

If NOT a task creation request:
{
  "isTask": false
}`;

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
          isComplex: result.isComplex || false,
          complexityIndicators: result.complexityIndicators || []
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
