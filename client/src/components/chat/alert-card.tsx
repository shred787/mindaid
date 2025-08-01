import { AlertTriangle, TrendingUp, Clock, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AlertCardProps {
  type: "urgent" | "insight" | "overdue" | "cashflow";
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  data?: {
    amount?: number;
    percentage?: number;
    progress?: number;
    daysOverdue?: number;
  };
}

const alertConfig = {
  urgent: {
    bgClass: "bg-gradient-to-r from-red-50 to-pink-50 border-red-200",
    iconClass: "bg-danger",
    textClass: "text-red-800",
    messageClass: "text-red-600",
    icon: AlertTriangle,
  },
  insight: {
    bgClass: "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200",
    iconClass: "bg-primary",
    textClass: "text-blue-800",
    messageClass: "text-blue-600",
    icon: TrendingUp,
  },
  overdue: {
    bgClass: "bg-gradient-to-r from-orange-50 to-red-50 border-orange-200",
    iconClass: "bg-warning",
    textClass: "text-orange-800",
    messageClass: "text-orange-600",
    icon: Clock,
  },
  cashflow: {
    bgClass: "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200",
    iconClass: "bg-success",
    textClass: "text-green-800",
    messageClass: "text-green-700",
    icon: TrendingUp,
  },
};

export function AlertCard({ type, title, message, action, data }: AlertCardProps) {
  const config = alertConfig[type];
  const Icon = config.icon;

  return (
    <div className={cn("border rounded-xl p-4", config.bgClass)}>
      <div className="flex items-center space-x-3">
        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", config.iconClass)}>
          <Icon className="text-white h-5 w-5" />
        </div>
        <div className="flex-1">
          <h4 className={cn("font-semibold", config.textClass)}>{title}</h4>
          <p className={cn("text-sm", config.messageClass)}>{message}</p>
          
          {/* Additional Data Display */}
          {data && (
            <div className="mt-2">
              {type === "cashflow" && data.amount && data.percentage && (
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-success">
                      ${data.amount.toLocaleString()}
                    </div>
                    <div className="text-xs text-green-600">Projected</div>
                  </div>
                  {data.progress && (
                    <>
                      <div className="flex-1 bg-green-200 rounded-full h-2">
                        <div 
                          className="bg-success h-2 rounded-full" 
                          style={{ width: `${data.progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-green-600">{data.progress}%</div>
                    </>
                  )}
                </div>
              )}
              
              {type === "overdue" && data.amount && data.daysOverdue && (
                <div className="flex items-center justify-between mt-2">
                  <Badge variant="destructive" className="text-xs">
                    {data.daysOverdue} days overdue
                  </Badge>
                  <span className="font-bold text-orange-800">
                    ${data.amount.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {action && (
          <Button
            size="sm"
            className={cn(
              "px-3 py-1 text-sm font-medium",
              type === "urgent" || type === "overdue" 
                ? "bg-danger hover:bg-danger/90 text-white" 
                : "bg-primary hover:bg-primary/90 text-white"
            )}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}
