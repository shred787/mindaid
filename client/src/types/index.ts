export interface DailyOverview {
  taskCount: number;
  urgentTasks: number;
  completedTasks: number;
  overdueCheckIns: number;
  activeHardAlerts: number;
}

export interface TaskBreakdown {
  subtasks: Array<{
    title: string;
    description: string;
    estimatedMinutes: number;
    priority: number;
  }>;
  totalTime: number;
  recommendations: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: any;
  timestamp: Date;
}

export interface WebSocketMessage {
  type: string;
  data: any;
}

export type ViewMode = "chat" | "calendar" | "gantt" | "accountability";

export interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}
