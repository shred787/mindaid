import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DayPicker } from "react-day-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Task } from "@shared/schema";
import { Clock, DollarSign, Calendar, CheckCircle, Circle, Edit3, ChevronRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import "react-day-picker/dist/style.css";

export function CalendarView() {
  // Initialize with August 1st, 2025 since that's when the tasks are scheduled
  const [selectedDate, setSelectedDate] = useState<Date>(new Date('2025-08-01'));
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState<Partial<Task>>({});
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

  // Function to find related subtasks for a project
  const getSubtasks = (parentTask: Task) => {
    if (!parentTask.title.includes("(Project)")) return [];
    
    // Find tasks that are related to this project based on title matching and timing
    const projectName = parentTask.title.replace(" (Project)", "");
    return tasks.filter(task => 
      task.id !== parentTask.id && 
      task.scheduledStart &&
      parentTask.scheduledStart &&
      parentTask.scheduledEnd &&
      new Date(task.scheduledStart) >= new Date(parentTask.scheduledStart) &&
      new Date(task.scheduledStart) <= new Date(parentTask.scheduledEnd)
    );
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setEditForm({
      title: task.title,
      description: task.description,
      priority: task.priority,
      estimatedMinutes: task.estimatedMinutes,
      status: task.status,
      revenueImpact: task.revenueImpact
    });
  };

  const handleSaveEdit = () => {
    if (!editingTask) return;
    
    updateTaskMutation.mutate({
      taskId: editingTask.id,
      updates: editForm
    });
    setEditingTask(null);
    setEditForm({});
  };

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
                  <Dialog key={task.id}>
                    <DialogTrigger asChild>
                      <div
                        className="border rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => setSelectedTask(task)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {task.completed ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Circle className="h-4 w-4 text-gray-400" />
                            )}
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
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center space-x-2">
                          <span>{task.title}</span>
                          <Badge variant={task.completed ? "secondary" : "destructive"}>
                            {task.completed ? "Complete" : "Pending"}
                          </Badge>
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {/* Task Description */}
                        {task.description && (
                          <div>
                            <h3 className="font-medium text-sm text-gray-700 mb-1">Description</h3>
                            <p className="text-gray-600">{task.description}</p>
                          </div>
                        )}
                        
                        {/* Task Details Grid */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h3 className="font-medium text-sm text-gray-700 mb-1">Priority</h3>
                            <Badge variant={task.priority >= 4 ? "destructive" : "secondary"}>
                              {task.priority >= 4 ? "High" : "Normal"} ({task.priority}/5)
                            </Badge>
                          </div>
                          <div>
                            <h3 className="font-medium text-sm text-gray-700 mb-1">Status</h3>
                            <span className="text-gray-600 capitalize">{task.status}</span>
                          </div>
                          <div>
                            <h3 className="font-medium text-sm text-gray-700 mb-1">Estimated Time</h3>
                            <span className="text-gray-600">{task.estimatedMinutes || 0} minutes</span>
                          </div>
                          <div>
                            <h3 className="font-medium text-sm text-gray-700 mb-1">Revenue Impact</h3>
                            <span className="text-gray-600">${Number(task.revenueImpact || 0).toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Subtasks Section */}
                        {(() => {
                          const subtasks = getSubtasks(task);
                          return subtasks.length > 0 ? (
                            <div>
                              <h3 className="font-medium text-sm text-gray-700 mb-2">
                                Subtasks ({subtasks.filter(st => st.completed).length}/{subtasks.length} complete)
                              </h3>
                              <div className="space-y-2">
                                {subtasks.map((subtask) => (
                                  <div
                                    key={subtask.id}
                                    className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg"
                                  >
                                    <Checkbox
                                      checked={subtask.completed}
                                      onCheckedChange={(checked) => {
                                        updateTaskMutation.mutate({
                                          taskId: subtask.id,
                                          updates: { completed: checked as boolean }
                                        });
                                      }}
                                    />
                                    <div className="flex-1">
                                      <span className={`text-sm ${subtask.completed ? "line-through text-gray-500" : "text-gray-700"}`}>
                                        {subtask.title}
                                      </span>
                                      {subtask.description && (
                                        <p className="text-xs text-gray-500 mt-1">{subtask.description}</p>
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {subtask.estimatedMinutes}m
                                    </div>
                                    {subtask.priority >= 4 && (
                                      <Badge variant="destructive" className="text-xs">
                                        Urgent
                                      </Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null;
                        })()}

                        {/* Schedule Information */}
                        {task.scheduledStart && (
                          <div>
                            <h3 className="font-medium text-sm text-gray-700 mb-1">Schedule</h3>
                            <div className="text-gray-600">
                              <div>Start: {formatTime(task.scheduledStart)} on {new Date(task.scheduledStart).toLocaleDateString()}</div>
                              {task.scheduledEnd && (
                                <div>End: {formatTime(task.scheduledEnd)} on {new Date(task.scheduledEnd).toLocaleDateString()}</div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex space-x-2 pt-4">
                          <Button
                            variant={task.completed ? "outline" : "default"}
                            onClick={() => {
                              updateTaskMutation.mutate({
                                taskId: task.id,
                                updates: { completed: !task.completed }
                              });
                            }}
                            disabled={updateTaskMutation.isPending}
                          >
                            {task.completed ? "Mark Incomplete" : "Mark Complete"}
                          </Button>
                          <Button variant="outline" onClick={() => handleEdit(task)}>
                            Edit Task
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update the task details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={editForm.title || ""}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="Task title"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={editForm.description || ""}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Task description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Priority (1-5)</label>
                <Select
                  value={editForm.priority?.toString() || ""}
                  onValueChange={(value) => setEditForm({ ...editForm, priority: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Low</SelectItem>
                    <SelectItem value="2">2 - Normal</SelectItem>
                    <SelectItem value="3">3 - Medium</SelectItem>
                    <SelectItem value="4">4 - High</SelectItem>
                    <SelectItem value="5">5 - Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={editForm.status || ""}
                  onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Estimated Minutes</label>
                <Input
                  type="number"
                  value={editForm.estimatedMinutes || ""}
                  onChange={(e) => setEditForm({ ...editForm, estimatedMinutes: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Revenue Impact ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.revenueImpact || ""}
                  onChange={(e) => setEditForm({ ...editForm, revenueImpact: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button onClick={handleSaveEdit} disabled={updateTaskMutation.isPending}>
                {updateTaskMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={() => setEditingTask(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
