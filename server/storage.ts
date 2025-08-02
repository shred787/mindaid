import { eq, desc, and, gte, lte, sum, count, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users, clients, projects, tasks, messages, notifications, checkIns,
  type User, type InsertUser,
  type Client, type InsertClient,
  type Project, type InsertProject,
  type Task, type InsertTask,
  type Message, type InsertMessage,
  type Notification, type InsertNotification,
  type CheckIn, type InsertCheckIn,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Clients
  getClients(userId: string): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, updates: Partial<InsertClient>): Promise<Client>;

  // Projects
  getProjects(userId: string): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: Partial<InsertProject>): Promise<Project>;

  // Tasks
  getTasks(userId: string, date?: Date): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, updates: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: string): Promise<void>;

  // Messages
  getMessages(userId: string, limit?: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Notifications
  getNotifications(userId: string, acknowledged?: boolean): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  acknowledgeNotification(id: string): Promise<void>;



  // Check-ins and Accountability
  getCheckIns(userId: string, completed?: boolean): Promise<CheckIn[]>;
  createCheckIn(checkIn: InsertCheckIn): Promise<CheckIn>;
  updateCheckIn(id: string, updates: Partial<InsertCheckIn>): Promise<CheckIn>;
  getOverdueCheckIns(userId: string): Promise<CheckIn[]>;

  // Hard Alerts System
  createHardAlert(userId: string, title: string, message: string, relatedTaskId?: string, relatedProjectId?: string): Promise<Notification>;
  getActiveHardAlerts(userId: string): Promise<Notification[]>;
  
  // Analytics
  getDailyOverview(userId: string, date: Date): Promise<{
    taskCount: number;
    potentialRevenue: number;
    urgentTasks: number;
    completedTasks: number;
    overdueCheckIns: number;
    activeHardAlerts: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getClients(userId: string): Promise<Client[]> {
    return await db.select().from(clients)
      .where(eq(clients.userId, userId))
      .orderBy(desc(clients.importance));
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db
      .insert(clients)
      .values(insertClient)
      .returning();
    return client;
  }

  async updateClient(id: string, updates: Partial<InsertClient>): Promise<Client> {
    const [client] = await db
      .update(clients)
      .set(updates)
      .where(eq(clients.id, id))
      .returning();
    return client;
  }

  async getProjects(userId: string): Promise<Project[]> {
    return await db.select().from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.createdAt));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values(insertProject)
      .returning();
    return project;
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set(updates)
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async getTasks(userId: string, date?: Date): Promise<Task[]> {
    let conditions = [eq(tasks.userId, userId)];
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      conditions.push(
        gte(tasks.scheduledStart, startOfDay),
        lte(tasks.scheduledStart, endOfDay)
      );
    }
    
    return await db.select().from(tasks)
      .where(and(...conditions))
      .orderBy(desc(tasks.priority), tasks.scheduledStart);
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db
      .insert(tasks)
      .values(insertTask)
      .returning();
    return task;
  }

  async updateTask(id: string, updates: Partial<InsertTask>): Promise<Task> {
    // Get the current task to check if it's a project
    const currentTask = await this.getTask(id);
    if (!currentTask) {
      throw new Error("Task not found");
    }

    // Check if there are subtasks for this project
    const subtasks = await db.select().from(tasks).where(eq(tasks.projectId, id));
    const isProject = subtasks.length > 0;

    // If attempting to complete a project that has incomplete subtasks, show appropriate behavior
    if (isProject && updates.completed === true) {
      const incompleteSubtasks = subtasks.filter(t => !t.completed);
      
      if (incompleteSubtasks.length > 0) {
        console.log(`Warning: Marking project complete with ${incompleteSubtasks.length} incomplete subtasks`);
        // Allow project completion but keep subtasks independent
        // This enables project-level milestone tracking while preserving granular task progress
      }
    }

    // Update the task
    const [task] = await db
      .update(tasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();

    return task;
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async getMessages(userId: string, limit: number = 50): Promise<Message[]> {
    return await db.select().from(messages)
      .where(eq(messages.userId, userId))
      .orderBy(desc(messages.timestamp))
      .limit(limit);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getNotifications(userId: string, acknowledged?: boolean): Promise<Notification[]> {
    let conditions = [eq(notifications.userId, userId)];
    
    if (acknowledged !== undefined) {
      conditions.push(eq(notifications.acknowledged, acknowledged));
    }
    
    return await db.select().from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.priority), desc(notifications.createdAt));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(insertNotification)
      .returning();
    return notification;
  }

  async acknowledgeNotification(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ acknowledged: true })
      .where(eq(notifications.id, id));
  }



  // Check-in Methods
  async getCheckIns(userId: string, completed?: boolean): Promise<CheckIn[]> {
    if (completed !== undefined) {
      return await db.select().from(checkIns)
        .where(and(
          eq(checkIns.userId, userId),
          eq(checkIns.completed, completed)
        ))
        .orderBy(desc(checkIns.dueAt));
    }
    
    return await db.select().from(checkIns)
      .where(eq(checkIns.userId, userId))
      .orderBy(desc(checkIns.dueAt));
  }

  async createCheckIn(checkIn: InsertCheckIn): Promise<CheckIn> {
    const [newCheckIn] = await db
      .insert(checkIns)
      .values(checkIn)
      .returning();
    return newCheckIn;
  }

  async updateCheckIn(id: string, updates: Partial<InsertCheckIn>): Promise<CheckIn> {
    const [checkIn] = await db
      .update(checkIns)
      .set(updates)
      .where(eq(checkIns.id, id))
      .returning();
    return checkIn;
  }

  async getOverdueCheckIns(userId: string): Promise<CheckIn[]> {
    const now = new Date();
    return await db.select().from(checkIns)
      .where(
        and(
          eq(checkIns.userId, userId),
          eq(checkIns.completed, false),
          lte(checkIns.dueAt, now)
        )
      )
      .orderBy(desc(checkIns.dueAt));
  }

  // Hard Alerts System
  async createHardAlert(userId: string, title: string, message: string, relatedTaskId?: string, relatedProjectId?: string): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values({
        userId,
        type: 'hard_alert',
        title,
        message,
        priority: 5, // Maximum priority
        dismissible: false, // Cannot be dismissed
        actionRequired: true,
        relatedTaskId,
        relatedProjectId,
      })
      .returning();
    return notification;
  }

  async getActiveHardAlerts(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.type, 'hard_alert'),
          eq(notifications.acknowledged, false)
        )
      )
      .orderBy(desc(notifications.createdAt));
  }

  async getDailyOverview(userId: string, date: Date): Promise<{
    taskCount: number;
    urgentTasks: number;
    completedTasks: number;
    overdueCheckIns: number;
    activeHardAlerts: number;
  }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [overview] = await db
      .select({
        taskCount: count(tasks.id),
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          gte(tasks.scheduledStart, startOfDay),
          lte(tasks.scheduledStart, endOfDay)
        )
      );

    const [urgentCount] = await db
      .select({ count: count(tasks.id) })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          gte(tasks.scheduledStart, startOfDay),
          lte(tasks.scheduledStart, endOfDay),
          gte(tasks.priority, 4)
        )
      );

    const [completedCount] = await db
      .select({ count: count(tasks.id) })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          gte(tasks.scheduledStart, startOfDay),
          lte(tasks.scheduledStart, endOfDay),
          eq(tasks.completed, true)
        )
      );

    // Get overdue check-ins count
    const overdueCheckInsCount = await this.getOverdueCheckIns(userId);
    
    // Get active hard alerts count
    const activeHardAlertsCount = await this.getActiveHardAlerts(userId);

    return {
      taskCount: overview.taskCount || 0,
      urgentTasks: urgentCount.count || 0,
      completedTasks: completedCount.count || 0,
      overdueCheckIns: overdueCheckInsCount.length,
      activeHardAlerts: activeHardAlertsCount.length,
    };
  }

  // Clear all data for fresh start
  async clearAllData(): Promise<void> {
    try {
      // Delete all data from tables in correct order (respecting foreign keys)
      await db.delete(notifications);
      await db.delete(checkIns);
      await db.delete(revenueEntries);
      await db.delete(messages);
      await db.delete(tasks);
      await db.delete(projects);
      await db.delete(clients);
      
      console.log("✅ All test data cleared - ready for real business data");
    } catch (error) {
      console.error("Error clearing data:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
