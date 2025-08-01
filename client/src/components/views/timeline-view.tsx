import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Task } from "@shared/schema";
import { Clock, Calendar, Target } from "lucide-react";

export function TimelineView() {
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

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

  const getTotalRevenue = (tasks: Task[]) => {
    return tasks.reduce((sum, task) => sum + (Number(task.revenueImpact) || 0), 0);
  };

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
            <span>Project Timeline</span>
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
                const totalRevenue = getTotalRevenue(dateTasks);

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
                          {totalRevenue > 0 && ` • $${totalRevenue.toLocaleString()} potential`}
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
                            <div className="bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-gray-900 flex items-center">
                                  <Target className="h-4 w-4 mr-2 text-primary" />
                                  {task.title}
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
                                  {Number(task.revenueImpact) > 0 && (
                                    <span className="text-success font-medium">
                                      ${Number(task.revenueImpact).toLocaleString()}
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
    </div>
  );
}
