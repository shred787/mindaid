import { Task } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, DollarSign, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  subtasks?: Array<{
    title: string;
    description: string;
    estimatedMinutes: number;
    completed?: boolean;
  }>;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onSubtaskToggle?: (index: number, completed: boolean) => void;
}

export function TaskCard({ 
  task, 
  subtasks = [], 
  onTaskUpdate, 
  onSubtaskToggle 
}: TaskCardProps) {
  const revenueAmount = Number(task.revenueImpact) || 0;
  const totalMinutes = task.estimatedMinutes || 0;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const timeString = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  const handleCompleteTask = (completed: boolean) => {
    onTaskUpdate?.(task.id, { completed });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      {/* Task Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={task.completed}
            onCheckedChange={handleCompleteTask}
          />
          <h4 className="font-semibold text-gray-800 flex items-center">
            <Target className="text-primary mr-2 h-4 w-4" />
            {task.title}
          </h4>
        </div>
        {revenueAmount > 0 && (
          <Badge className="bg-success hover:bg-success text-white">
            ${revenueAmount.toLocaleString()}
          </Badge>
        )}
      </div>

      {/* Task Description */}
      {task.description && (
        <p className="text-sm text-gray-600 mb-3">{task.description}</p>
      )}

      {/* Subtasks */}
      {subtasks.length > 0 && (
        <div className="space-y-2 mb-3">
          {subtasks.map((subtask, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg"
            >
              <Checkbox
                checked={subtask.completed || false}
                onCheckedChange={(checked) => onSubtaskToggle?.(index, checked as boolean)}
              />
              <span className={cn(
                "text-sm flex-1",
                subtask.completed ? "line-through text-gray-500" : "text-gray-700"
              )}>
                {subtask.title}
              </span>
              <span className="text-xs text-gray-500">
                {subtask.estimatedMinutes}m
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Task Footer */}
      <div className="pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="text-gray-600 flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {timeString}
            </span>
            {task.priority && task.priority > 3 && (
              <Badge variant="destructive" className="text-xs">
                Urgent
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {task.scheduledStart && (
              <span className="text-xs text-gray-500">
                {new Date(task.scheduledStart).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
