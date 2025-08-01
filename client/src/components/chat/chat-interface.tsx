import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageBubble } from "./message-bubble";
import { TaskCard } from "./task-card";
import { AlertCard } from "./alert-card";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useWebSocket } from "@/hooks/use-websocket";
import { ChatMessage, DailyOverview } from "@/types";
import { Task, Message } from "@shared/schema";
import { Calendar, Target, TrendingUp } from "lucide-react";

export function ChatInterface() {
  const queryClient = useQueryClient();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [currentDate] = useState(new Date());

  // Queries
  const { data: overview } = useQuery<DailyOverview>({
    queryKey: ["/api/overview"],
    refetchInterval: 60000, // Refetch every minute
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Mutations
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", "/api/messages", {
        role: "user",
        content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: Partial<Task> }) => {
      return apiRequest("PATCH", `/api/tasks/${taskId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/overview"] });
    },
  });

  // WebSocket for real-time updates
  useWebSocket({
    onMessage: (message) => {
      if (message.type === "message" || message.type === "task_updated") {
        queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
        queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      }
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (content: string) => {
    sendMessageMutation.mutate(content);
  };

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    updateTaskMutation.mutate({ taskId, updates });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Convert messages to chat format
  const chatMessages: ChatMessage[] = messages.map(msg => ({
    id: msg.id,
    role: msg.role as "user" | "assistant" | "system",
    content: msg.content,
    metadata: msg.metadata,
    timestamp: new Date(msg.timestamp),
  }));

  // Get high-priority tasks for display
  const urgentTasks = tasks.filter(task => task.priority >= 4 && !task.completed);
  const featuredTask = tasks.find(task => !task.completed && task.revenueImpact && Number(task.revenueImpact) > 0);

  return (
    <div className="flex-1 pb-24">
      {/* Daily Summary Card */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                Today's Overview
              </h3>
              <span className="text-sm text-gray-500">{formatDate(currentDate)}</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {overview?.taskCount || 0}
                </div>
                <div className="text-xs text-gray-600">Tasks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">
                  ${((overview?.potentialRevenue || 0) / 1000).toFixed(1)}k
                </div>
                <div className="text-xs text-gray-600">Potential</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">
                  {overview?.urgentTasks || 0}
                </div>
                <div className="text-xs text-gray-600">Urgent</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat Messages */}
      <div className="px-4 pt-4 space-y-4" style={{ height: "calc(100vh - 280px)", overflowY: "auto" }}>
        
        {/* Welcome message if no messages */}
        {chatMessages.length === 0 && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <i className="fas fa-robot text-white text-sm"></i>
            </div>
            <div className="flex-1">
              <div className="bg-gray-100 rounded-xl rounded-tl-sm p-3 max-w-xs">
                <p className="text-sm text-gray-800">
                  Good morning! I'm here to help you manage your tasks and maximize your productivity. 
                  What would you like to work on today?
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {new Date().toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </p>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        {chatMessages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Featured Task Card */}
        {featuredTask && (
          <TaskCard
            task={featuredTask}
            onTaskUpdate={handleTaskUpdate}
          />
        )}

        {/* Urgent Alerts */}
        {urgentTasks.length > 0 && (
          <AlertCard
            type="urgent"
            title="Urgent Tasks Pending"
            message={`You have ${urgentTasks.length} urgent task${urgentTasks.length > 1 ? 's' : ''} that need immediate attention.`}
            action={{
              label: "View Tasks",
              onClick: () => {
                // Handle navigation to task view
                console.log("Navigate to urgent tasks");
              },
            }}
          />
        )}

        {/* Cash Flow Insight */}
        {overview && overview.potentialRevenue > 0 && (
          <AlertCard
            type="cashflow"
            title="Cash Flow Insight"
            message="Completing today's tasks will improve your weekly revenue significantly"
            data={{
              amount: overview.potentialRevenue,
              percentage: Math.round((overview.completedTasks / overview.taskCount) * 100) || 0,
              progress: Math.round((overview.completedTasks / overview.taskCount) * 100) || 0,
            }}
          />
        )}

        <div ref={chatEndRef} />
      </div>
    </div>
  );
}
