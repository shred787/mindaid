import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  importance: integer("importance").default(1).notNull(), // 1-5 scale
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  clientId: varchar("client_id"),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("active").notNull(), // active, completed, on_hold
  estimatedValue: decimal("estimated_value", { precision: 10, scale: 2 }),
  deadline: timestamp("deadline"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  projectId: varchar("project_id"),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("pending").notNull(), // pending, in_progress, completed, blocked
  priority: integer("priority").default(1).notNull(), // 1-5 scale
  estimatedMinutes: integer("estimated_minutes"),
  actualMinutes: integer("actual_minutes"),
  revenueImpact: decimal("revenue_impact", { precision: 10, scale: 2 }),
  scheduledStart: timestamp("scheduled_start"),
  scheduledEnd: timestamp("scheduled_end"),
  completed: boolean("completed").default(false).notNull(),
  completionEvidence: jsonb("completion_evidence"), // Evidence of task completion
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  role: text("role").notNull(), // user, assistant, system
  content: text("content").notNull(),
  metadata: jsonb("metadata"), // for storing task references, financial data, etc.
  timestamp: timestamp("timestamp").default(sql`now()`).notNull(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(), // check_in, task_reminder, urgent_alert, cash_flow_insight, hard_alert, deadline_warning
  title: text("title").notNull(),
  message: text("message").notNull(),
  priority: integer("priority").default(1).notNull(), // 1-5 scale, 5 being emergency
  acknowledged: boolean("acknowledged").default(false).notNull(),
  dismissible: boolean("dismissible").default(true).notNull(), // hard alerts cannot be dismissed
  actionRequired: boolean("action_required").default(false).notNull(),
  relatedTaskId: varchar("related_task_id"),
  relatedProjectId: varchar("related_project_id"),
  expiresAt: timestamp("expires_at"), // for time-sensitive alerts
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Add revenue tracking table
export const revenueEntries = pgTable("revenue_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  clientId: varchar("client_id"),
  projectId: varchar("project_id"),
  taskId: varchar("task_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull(), // income, expense, projection
  category: text("category"), // consulting, products, services, overhead, etc.
  description: text("description"),
  date: timestamp("date").notNull(),
  isRecurring: boolean("is_recurring").default(false).notNull(),
  recurringFrequency: text("recurring_frequency"), // weekly, monthly, quarterly, yearly
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Add accountability tracking
export const checkIns = pgTable("check_ins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(), // daily, weekly, project_milestone, emergency
  prompt: text("prompt").notNull(),
  response: text("response"),
  mood: integer("mood"), // 1-5 scale
  productivity: integer("productivity"), // 1-5 scale
  blockers: text("blockers"),
  wins: text("wins"),
  nextSteps: text("next_steps"),
  completed: boolean("completed").default(false).notNull(),
  dueAt: timestamp("due_at").notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  clients: many(clients),
  projects: many(projects),
  tasks: many(tasks),
  messages: many(messages),
  notifications: many(notifications),
  revenueEntries: many(revenueEntries),
  checkIns: many(checkIns),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, {
    fields: [clients.userId],
    references: [users.id],
  }),
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [projects.clientId],
    references: [clients.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  relatedTask: one(tasks, {
    fields: [notifications.relatedTaskId],
    references: [tasks.id],
  }),
  relatedProject: one(projects, {
    fields: [notifications.relatedProjectId],
    references: [projects.id],
  }),
}));

export const revenueEntriesRelations = relations(revenueEntries, ({ one }) => ({
  user: one(users, {
    fields: [revenueEntries.userId],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [revenueEntries.clientId],
    references: [clients.id],
  }),
  project: one(projects, {
    fields: [revenueEntries.projectId],
    references: [projects.id],
  }),
  task: one(tasks, {
    fields: [revenueEntries.taskId],
    references: [tasks.id],
  }),
}));

export const checkInsRelations = relations(checkIns, ({ one }) => ({
  user: one(users, {
    fields: [checkIns.userId],
    references: [users.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertRevenueEntrySchema = createInsertSchema(revenueEntries).omit({
  id: true,
  createdAt: true,
}).extend({
  date: z.coerce.date(),
});

export const insertCheckInSchema = createInsertSchema(checkIns).omit({
  id: true,
  createdAt: true,
}).extend({
  dueAt: z.coerce.date(),
  completedAt: z.coerce.date().optional(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type RevenueEntry = typeof revenueEntries.$inferSelect;
export type InsertRevenueEntry = z.infer<typeof insertRevenueEntrySchema>;

export type CheckIn = typeof checkIns.$inferSelect;
export type InsertCheckIn = z.infer<typeof insertCheckInSchema>;
