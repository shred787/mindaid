import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Task } from "@shared/schema";
import { DailyOverview } from "@/types";
import { DollarSign, TrendingUp, TrendingDown, Target } from "lucide-react";

export function CashFlowView() {
  const { data: overview } = useQuery<DailyOverview>({
    queryKey: ["/api/overview"],
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Calculate cash flow metrics
  const completedRevenue = tasks
    .filter(task => task.completed)
    .reduce((sum, task) => sum + (Number(task.revenueImpact) || 0), 0);

  const pendingRevenue = tasks
    .filter(task => !task.completed)
    .reduce((sum, task) => sum + (Number(task.revenueImpact) || 0), 0);

  const totalRevenue = completedRevenue + pendingRevenue;
  const completionRate = totalRevenue > 0 ? (completedRevenue / totalRevenue) * 100 : 0;

  // Group tasks by revenue impact
  const highValueTasks = tasks.filter(task => Number(task.revenueImpact) >= 1000);
  const mediumValueTasks = tasks.filter(task => Number(task.revenueImpact) >= 500 && Number(task.revenueImpact) < 1000);
  const lowValueTasks = tasks.filter(task => Number(task.revenueImpact) > 0 && Number(task.revenueImpact) < 500);

  const getRevenueInsight = () => {
    if (completionRate >= 80) {
      return {
        type: "positive",
        message: "Excellent progress! You're on track to exceed revenue targets.",
        icon: TrendingUp,
        color: "text-success",
      };
    } else if (completionRate >= 50) {
      return {
        type: "neutral",
        message: "Good progress. Focus on high-value tasks to maximize revenue.",
        icon: TrendingUp,
        color: "text-warning",
      };
    } else {
      return {
        type: "negative",
        message: "Revenue at risk. Prioritize high-value tasks immediately.",
        icon: TrendingDown,
        color: "text-danger",
      };
    }
  };

  const insight = getRevenueInsight();
  const InsightIcon = insight.icon;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const TaskGroup = ({ 
    title, 
    tasks, 
    color 
  }: { 
    title: string; 
    tasks: Task[]; 
    color: string;
  }) => {
    const groupRevenue = tasks.reduce((sum, task) => sum + (Number(task.revenueImpact) || 0), 0);
    const completedTasks = tasks.filter(task => task.completed);
    const groupProgress = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

    if (tasks.length === 0) return null;

    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${color}`} />
              <span>{title}</span>
            </span>
            <span className="text-sm font-normal text-gray-600">
              {formatCurrency(groupRevenue)}
            </span>
          </CardTitle>
          <Progress value={groupProgress} className="h-2" />
          <p className="text-xs text-gray-500">
            {completedTasks.length} of {tasks.length} completed ({Math.round(groupProgress)}%)
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {tasks.slice(0, 3).map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-2 flex-1">
                  <Target className="h-3 w-3 text-gray-400" />
                  <span className={`text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {task.title}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-600">
                    {formatCurrency(Number(task.revenueImpact))}
                  </span>
                  {task.completed && (
                    <Badge variant="default" className="text-xs">
                      ✓
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            {tasks.length > 3 && (
              <p className="text-xs text-gray-500 text-center">
                +{tasks.length - 3} more tasks
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Revenue Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Revenue Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-success">
                {formatCurrency(completedRevenue)}
              </div>
              <div className="text-sm text-green-600">Completed</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(pendingRevenue)}
              </div>
              <div className="text-sm text-blue-600">Pending</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Revenue Progress</span>
              <span className="font-medium">{Math.round(completionRate)}%</span>
            </div>
            <Progress value={completionRate} className="h-3" />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{formatCurrency(completedRevenue)}</span>
              <span>{formatCurrency(totalRevenue)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Insight */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${insight.type === 'positive' ? 'bg-green-100' : insight.type === 'neutral' ? 'bg-yellow-100' : 'bg-red-100'}`}>
              <InsightIcon className={`h-5 w-5 ${insight.color}`} />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">Revenue Insight</h4>
              <p className="text-sm text-gray-600">{insight.message}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Groups by Revenue */}
      <div className="space-y-4">
        <TaskGroup
          title="High Value Tasks ($1,000+)"
          tasks={highValueTasks}
          color="bg-green-500"
        />
        
        <TaskGroup
          title="Medium Value Tasks ($500-$999)"
          tasks={mediumValueTasks}
          color="bg-yellow-500"
        />
        
        <TaskGroup
          title="Low Value Tasks (<$500)"
          tasks={lowValueTasks}
          color="bg-blue-500"
        />
      </div>

      {/* Revenue Forecast */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">This Week's Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Current Week Progress</span>
              <span className="font-medium">{Math.round(completionRate)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Projected Revenue</span>
              <span className="font-bold text-success">
                {formatCurrency(totalRevenue * (completionRate / 100) + pendingRevenue * 0.7)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Potential Maximum</span>
              <span className="font-medium text-primary">
                {formatCurrency(totalRevenue)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
