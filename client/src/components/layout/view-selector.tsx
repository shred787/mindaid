import { ViewMode } from "@/types";
import { MessageCircle, Calendar, BarChart3, DollarSign, TrendingUp, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewSelectorProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

const viewConfig = {
  chat: { icon: MessageCircle, label: "Chat" },
  calendar: { icon: Calendar, label: "Calendar" },
  gantt: { icon: BarChart3, label: "Timeline" },
  cashflow: { icon: DollarSign, label: "Cash Flow" },
  revenue: { icon: TrendingUp, label: "Revenue" },
  accountability: { icon: Shield, label: "Check-ins" },
};

export function ViewSelector({ currentView, onViewChange }: ViewSelectorProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-2 sm:px-4 py-2">
      <div className="flex space-x-0.5 sm:space-x-1 bg-gray-100 rounded-lg p-1">
        {Object.entries(viewConfig).map(([key, config]) => {
          const Icon = config.icon;
          const isActive = currentView === key;
          
          return (
            <button
              key={key}
              onClick={() => onViewChange(key as ViewMode)}
              className={cn(
                "flex-1 py-1.5 sm:py-2 px-1 sm:px-3 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center justify-center",
                "min-w-0", // Allow button to shrink
                isActive
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-200"
              )}
            >
              <Icon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="ml-1 truncate hidden xs:inline">{config.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
