import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DayPicker } from "react-day-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Task } from "@shared/schema";
import { Clock, DollarSign, Calendar } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import "react-day-picker/dist/style.css";

export function CalendarView() {
  // Initialize with August 1st, 2025 since that's when the tasks are scheduled
  const [selectedDate, setSelectedDate] = useState<Date>(new Date('2025-08-01'));
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
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

  const tasksForSelectedDate = tasks.filter(task => {
    if (!task.scheduledStart) return false;
    const taskDate = new Date(task.scheduledStart);
    return taskDate.toDateString() === selectedDate.toDateString();
  });

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.scheduledStart) return false;
      const taskDate = new Date(task.scheduledStart);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  const modifiers = {
    hasTasks: (date: Date) => getTasksForDate(date).length > 0,
    urgent: (date: Date) => getTasksForDate(date).some(task => task.priority >= 4),
  };

  const modifiersStyles = {
    hasTasks: {
      backgroundColor: '#E5F3FF',
      color: '#1E40AF',
      fontWeight: 'bold',
    },
    urgent: {
      backgroundColor: '#FEE2E2',
      color: '#DC2626',
      fontWeight: 'bold',
    },
  };

  const formatTime = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getTotalRevenue = (tasks: Task[]) => {
    return tasks.reduce((sum, task) => sum + (Number(task.revenueImpact) || 0), 0);
  };

  const getTotalTime = (tasks: Task[]) => {
    return tasks.reduce((sum, task) => sum + (task.estimatedMinutes || 0), 0);
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Task Calendar</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={(date: Date | undefined) => date && setSelectedDate(date)}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      {/* Selected Date Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {selectedDate.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </span>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{Math.round(getTotalTime(tasksForSelectedDate) / 60)}h</span>
              </div>
              <div className="flex items-center space-x-1">
                <DollarSign className="h-4 w-4" />
                <span>${getTotalRevenue(tasksForSelectedDate).toLocaleString()}</span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tasksForSelectedDate.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500">No tasks scheduled for this date</p>
              <p className="text-xs text-gray-400 mt-2">
                Total tasks loaded: {tasks.length} | Selected date: {selectedDate.toDateString()}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasksForSelectedDate
                .sort((a, b) => {
                  if (!a.scheduledStart) return 1;
                  if (!b.scheduledStart) return -1;
                  return new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime();
                })
                .map((task) => (
                  <div
                    key={task.id}
                    className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={(checked) => {
                            console.log("Checkbox clicked:", task.id, checked);
                            updateTaskMutation.mutate({
                              taskId: task.id,
                              updates: { completed: checked as boolean }
                            });
                          }}
                        />
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                      </div>
                      <div className="flex items-center space-x-2">
                        {task.priority >= 4 && (
                          <Badge variant="destructive" className="text-xs">
                            Urgent
                          </Badge>
                        )}
                        {Number(task.revenueImpact) > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            ${Number(task.revenueImpact).toLocaleString()}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {task.scheduledStart && formatTime(task.scheduledStart)}
                        {task.scheduledEnd && ` - ${formatTime(task.scheduledEnd)}`}
                      </span>
                      <span>{task.estimatedMinutes}m</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
