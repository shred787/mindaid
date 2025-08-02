import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { openaiService } from "./services/openai";
import { setupWebSocket } from "./services/websocket";
import { insertMessageSchema, insertTaskSchema, insertNotificationSchema, insertRevenueEntrySchema, insertCheckInSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  setupWebSocket(wss);

  // Mock user ID for development - in real app, this would come from authentication
  const DEMO_USER_ID = "demo-user-123";

  // Ensure demo user exists
  let demoUser = await storage.getUserByEmail("demo@example.com");
  if (!demoUser) {
    demoUser = await storage.createUser({
      username: "demo",
      email: "demo@example.com",
      name: "Demo User",
    });
  }

  // API Routes
  app.get("/api/overview", async (req, res) => {
    try {
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      const overview = await storage.getDailyOverview(demoUser.id, date);
      res.json(overview);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch overview" });
    }
  });

  app.get("/api/tasks", async (req, res) => {
    try {
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      const tasks = await storage.getTasks(demoUser.id, date);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const taskData = insertTaskSchema.parse({
        ...req.body,
        userId: demoUser.id,
      });
      const task = await storage.createTask(taskData);
      res.json(task);
    } catch (error) {
      res.status(400).json({ error: "Invalid task data" });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Evidence-based completion validation - ALL task completions require evidence
      if (updates.completed === true && !req.body.evidence) {
        const currentTask = await storage.getTask(id);
        return res.status(409).json({ 
          error: "Evidence required",
          requiresEvidence: true,
          taskTitle: currentTask?.title || "Task"
        });
      }
      
      // If evidence is provided with completion, add it to the updates
      if (updates.completed === true && req.body.evidence) {
        updates.completionEvidence = req.body.evidence;
      }
      
      const task = await storage.updateTask(id, updates);
      res.json(task);
    } catch (error) {
      res.status(400).json({ error: "Failed to update task" });
    }
  });

  app.get("/api/messages", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const messages = await storage.getMessages(demoUser.id, limit);
      res.json(messages.reverse()); // Return in chronological order
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse({
        ...req.body,
        userId: demoUser.id,
      });

      // Save user message
      const userMessage = await storage.createMessage(messageData);

      // Get AI response if it's a user message
      if (messageData.role === "user") {
        const aiResponse = await openaiService.processUserMessage(
          messageData.content,
          demoUser.id
        );

        // Save AI response
        const assistantMessage = await storage.createMessage({
          userId: demoUser.id,
          role: "assistant",
          content: aiResponse.content,
          metadata: aiResponse.metadata,
        });

        // Broadcast to WebSocket clients
        wss.clients.forEach((client) => {
          if (client.readyState === 1) { // WebSocket.OPEN
            client.send(JSON.stringify({
              type: "message",
              data: assistantMessage
            }));
          }
        });

        res.json({ userMessage, assistantMessage });
      } else {
        res.json({ userMessage });
      }
    } catch (error) {
      console.error("Error processing message:", error);
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  app.get("/api/notifications", async (req, res) => {
    try {
      const acknowledged = req.query.acknowledged === "true" ? true : 
                          req.query.acknowledged === "false" ? false : undefined;
      const notifications = await storage.getNotifications(demoUser.id, acknowledged);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications/:id/acknowledge", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.acknowledgeNotification(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to acknowledge notification" });
    }
  });

  app.post("/api/ai/break-down-task", async (req, res) => {
    try {
      const { taskDescription, estimatedTime, revenueImpact } = req.body;
      
      const breakdown = await openaiService.breakDownTask({
        description: taskDescription,
        estimatedTime,
        revenueImpact,
      });

      res.json(breakdown);
    } catch (error) {
      console.error("Error breaking down task:", error);
      res.status(500).json({ error: "Failed to break down task" });
    }
  });

  app.post("/api/ai/reschedule", async (req, res) => {
    try {
      const { reason, affectedTasks } = req.body;
      
      const reschedule = await openaiService.generateReschedule({
        reason,
        affectedTasks,
      });

      res.json(reschedule);
    } catch (error) {
      console.error("Error generating reschedule:", error);
      res.status(500).json({ error: "Failed to generate reschedule" });
    }
  });

  // Test endpoint for task complexity detection
  app.post("/api/test/task-detection", async (req, res) => {
    try {
      const { message } = req.body;
      
      const taskData = await openaiService.extractTaskFromMessage(message);
      
      res.json({
        input: message,
        detected: taskData ? {
          isTask: !!taskData,
          scenario: taskData.scenario,
          title: taskData.title,
          priority: taskData.priority,
          estimatedMinutes: taskData.estimatedMinutes,
          affectedClients: taskData.affectedClients,
          businessContext: taskData.businessContext,
          isComplex: taskData.isComplex
        } : { isTask: false }
      });
    } catch (error) {
      console.error("Error testing task detection:", error);
      res.status(500).json({ error: "Failed to test task detection" });
    }
  });

  // Revenue Tracking Routes
  app.get("/api/revenue", async (req, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const entries = await storage.getRevenueEntries(demoUser.id, startDate, endDate);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch revenue entries" });
    }
  });

  app.post("/api/revenue", async (req, res) => {
    try {
      const entryData = insertRevenueEntrySchema.parse({
        ...req.body,
        userId: demoUser.id,
        amount: parseFloat(req.body.amount),
      });
      const entry = await storage.createRevenueEntry(entryData);
      res.json(entry);
    } catch (error) {
      console.error("Revenue validation error:", error);
      res.status(400).json({ error: "Invalid revenue entry data", details: error.message });
    }
  });

  app.get("/api/revenue/stats/:period", async (req, res) => {
    try {
      const { period } = req.params;
      if (!['month', 'quarter', 'year'].includes(period)) {
        return res.status(400).json({ error: "Invalid period" });
      }
      const stats = await storage.getRevenueStats(demoUser.id, period as 'month' | 'quarter' | 'year');
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch revenue stats" });
    }
  });

  // Check-in Routes
  app.get("/api/checkins", async (req, res) => {
    try {
      const completed = req.query.completed === "true" ? true : 
                      req.query.completed === "false" ? false : undefined;
      const checkIns = await storage.getCheckIns(demoUser.id, completed);
      res.json(checkIns);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch check-ins" });
    }
  });

  app.post("/api/checkins", async (req, res) => {
    try {
      const checkInData = insertCheckInSchema.parse({
        ...req.body,
        userId: demoUser.id,
      });
      const checkIn = await storage.createCheckIn(checkInData);
      res.json(checkIn);
    } catch (error) {
      console.error("Check-in validation error:", error);
      res.status(400).json({ error: "Invalid check-in data", details: error.message });
    }
  });

  app.patch("/api/checkins/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const checkIn = await storage.updateCheckIn(id, updates);
      res.json(checkIn);
    } catch (error) {
      res.status(400).json({ error: "Failed to update check-in" });
    }
  });

  app.get("/api/checkins/overdue", async (req, res) => {
    try {
      const overdueCheckIns = await storage.getOverdueCheckIns(demoUser.id);
      res.json(overdueCheckIns);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch overdue check-ins" });
    }
  });

  // Hard Alerts Routes
  app.post("/api/alerts/hard", async (req, res) => {
    try {
      const { title, message, relatedTaskId, relatedProjectId } = req.body;
      const alert = await storage.createHardAlert(
        demoUser.id, 
        title, 
        message, 
        relatedTaskId, 
        relatedProjectId
      );
      
      // Broadcast to WebSocket clients immediately
      wss.clients.forEach((client) => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(JSON.stringify({
            type: "hard_alert",
            data: alert
          }));
        }
      });
      
      res.json(alert);
    } catch (error) {
      res.status(400).json({ error: "Failed to create hard alert" });
    }
  });

  app.get("/api/alerts/hard", async (req, res) => {
    try {
      const hardAlerts = await storage.getActiveHardAlerts(demoUser.id);
      res.json(hardAlerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch hard alerts" });
    }
  });

  // Accountability System Routes
  app.post("/api/accountability/deadline-warning", async (req, res) => {
    try {
      const { taskId, message } = req.body;
      const task = await storage.getTask(taskId);
      
      if (task) {
        const alert = await storage.createHardAlert(
          demoUser.id,
          "Deadline Warning",
          message || `Task "${task.title}" is approaching its deadline!`,
          taskId
        );
        
        // Broadcast to WebSocket clients
        wss.clients.forEach((client) => {
          if (client.readyState === 1) {
            client.send(JSON.stringify({
              type: "deadline_warning",
              data: alert
            }));
          }
        });
        
        res.json(alert);
      } else {
        res.status(404).json({ error: "Task not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to create deadline warning" });
    }
  });

  // Periodic check-in system (in a real app, this would be handled by a cron job)
  setInterval(async () => {
    try {
      const notification = await storage.createNotification({
        userId: demoUser.id,
        type: "check_in",
        title: "Hourly Check-in",
        message: "How are you progressing with your current task?",
        priority: 3,
      });

      // Broadcast to WebSocket clients
      wss.clients.forEach((client) => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(JSON.stringify({
            type: "notification",
            data: notification
          }));
        }
      });
    } catch (error) {
      console.error("Error creating check-in notification:", error);
    }
  }, 60 * 60 * 1000); // Every hour

  return httpServer;
}
