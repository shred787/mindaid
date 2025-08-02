import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Task } from "@shared/schema";
import { Clock, Calendar, Target, ChevronRight } from "lucide-react";

export function TimelineView() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Helper function to determine if a task is a subtask (has a parent)
  const getParentTask = (task: Task): Task | undefined => {
    // Check if task title contains patterns that indicate it's a subtask
    if (task.title.includes('- ') || task.title.includes(': ')) {
      // Find parent task by looking for similar title patterns or project association
      return tasks.find(t => t.id !== task.id && (
        task.title.toLowerCase().includes(t.title.toLowerCase()) ||
        (t.projectId && t.projectId === task.projectId && t.estimatedMinutes > task.estimatedMinutes)
      ));
    }
    return undefined;
  };

  const getSubtasks = (parentTask: Task): Task[] => {
    return tasks.filter(task => 
      task.id !== parentTask.id && 
      (task.title.toLowerCase().includes(parentTask.title.toLowerCase()) ||
       (task.projectId && task.projectId === parentTask.projectId && task.estimatedMinutes < parentTask.estimatedMinutes))
    );
  };

  // Group tasks by date
  const tasksByDate = tasks.reduce((acc, task) => {
    if (!task.scheduledStart) return acc;
    
    const date = new Date(task.scheduledStart).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  // Sort dates
  const sortedDates = Object.keys(tasksByDate).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getTaskProgress = (tasks: Task[]) => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.completed).length;
    return Math.round((completed / tasks.length) * 100);
  };

  // Revenue impact removed - now using priority-based system instead

  const getStatusColor = (task: Task) => {
    if (task.completed) return "bg-success";
    if (task.priority >= 4) return "bg-danger";
    if (task.status === "in_progress") return "bg-warning";
    return "bg-gray-400";
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Tasks Timeline</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {sortedDates.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No scheduled tasks found</p>
            ) : (
              sortedDates.map((dateString) => {
                const dateTasks = tasksByDate[dateString];
                const progress = getTaskProgress(dateTasks);

                return (
                  <div key={dateString} className="relative">
                    {/* Date Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          {formatDate(dateString)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {dateTasks.length} task{dateTasks.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-700">
                          {progress}% Complete
                        </div>
                        <Progress value={progress} className="w-20 h-2 mt-1" />
                      </div>
                    </div>

                    {/* Timeline Tasks */}
                    <div className="space-y-3 ml-4 border-l-2 border-gray-200 relative">
                      {dateTasks
                        .sort((a, b) => {
                          if (!a.scheduledStart) return 1;
                          if (!b.scheduledStart) return -1;
                          return new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime();
                        })
                        .map((task, index) => (
                          <div key={task.id} className="relative pl-6">
                            {/* Timeline Dot */}
                            <div
                              className={`absolute -left-2 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(task)}`}
                            />

                            {/* Task Card */}
                            <div className="bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                 onClick={() => setSelectedTask(task)}>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-gray-900 flex items-center">
                                  <Target className="h-4 w-4 mr-2 text-primary" />
                                  {(() => {
                                    const parentTask = getParentTask(task);
                                    const subtasks = getSubtasks(task);
                                    
                                    if (parentTask) {
                                      return (
                                        <span className="flex items-center">
                                          <span className="text-xs text-gray-500 mr-2">
                                            {parentTask.title} →
                                          </span>
                                          {task.title}
                                        </span>
                                      );
                                    } else if (subtasks.length > 0) {
                                      return (
                                        <span className="flex items-center">
                                          {task.title}
                                          <span className="text-xs text-gray-500 ml-2">
                                            ({subtasks.length} subtask{subtasks.length !== 1 ? 's' : ''})
                                          </span>
                                        </span>
                                      );
                                    }
                                    return task.title;
                                  })()}
                                </h4>
                                <div className="flex items-center space-x-2">
                                  {task.scheduledStart && (
                                    <span className="text-xs text-gray-500">
                                      {formatTime(task.scheduledStart)}
                                    </span>
                                  )}
                                  {task.priority >= 4 && (
                                    <Badge variant="destructive" className="text-xs">
                                      Urgent
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {task.description && (
                                <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                              )}

                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center space-x-3">
                                  <span className="flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {task.estimatedMinutes}m
                                  </span>
                                  {task.priority >= 4 && (
                                    <span className="text-red-600 font-medium text-xs">
                                      High Priority
                                    </span>
                                  )}
                                </div>
                                <Badge
                                  variant={task.completed ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {task.completed ? "Completed" : task.status.replace("_", " ")}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Task Details Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-primary" />
              {selectedTask?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              {selectedTask.description && (
                <div>
                  <h3 className="font-medium text-sm text-gray-700 mb-1">Description</h3>
                  <p className="text-gray-600">{selectedTask.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-sm text-gray-700 mb-1">Status</h3>
                  <Badge variant={selectedTask.completed ? "default" : "secondary"}>
                    {selectedTask.completed ? "Completed" : selectedTask.status.replace("_", " ")}
                  </Badge>
                </div>
                
                <div>
                  <h3 className="font-medium text-sm text-gray-700 mb-1">Priority</h3>
                  <Badge variant={selectedTask.priority >= 4 ? "destructive" : "secondary"}>
                    {selectedTask.priority >= 4 ? "High Priority" : "Normal Priority"}
                  </Badge>
                </div>
                
                <div>
                  <h3 className="font-medium text-sm text-gray-700 mb-1">Estimated Time</h3>
                  <span className="text-gray-600">{selectedTask.estimatedMinutes} minutes</span>
                </div>
                
                {(() => {
                  const parentTask = getParentTask(selectedTask);
                  const subtasks = getSubtasks(selectedTask);
                  
                  if (parentTask) {
                    return (
                      <div>
                        <h3 className="font-medium text-sm text-gray-700 mb-1">Parent Task</h3>
                        <span className="text-blue-600 font-medium">{parentTask.title}</span>
                      </div>
                    );
                  } else if (subtasks.length > 0) {
                    return (
                      <div>
                        <h3 className="font-medium text-sm text-gray-700 mb-1">Subtasks</h3>
                        <div className="space-y-1">
                          {subtasks.map(subtask => (
                            <div key={subtask.id} className="text-sm text-gray-600">
                              • {subtask.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
              
              {selectedTask.scheduledStart && (
                <div>
                  <h3 className="font-medium text-sm text-gray-700 mb-1">Schedule</h3>
                  <div className="text-gray-600">
                    <div>Start: {new Date(selectedTask.scheduledStart).toLocaleString()}</div>
                    {selectedTask.scheduledEnd && (
                      <div>End: {new Date(selectedTask.scheduledEnd).toLocaleString()}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
