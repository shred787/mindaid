import { ViewMode } from "@/types";
import { MessageCircle, Calendar, BarChart3, DollarSign } from "lucide-react";
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
};

export function ViewSelector({ currentView, onViewChange }: ViewSelectorProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2">
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        {Object.entries(viewConfig).map(([key, config]) => {
          const Icon = config.icon;
          const isActive = currentView === key;
          
          return (
            <button
              key={key}
              onClick={() => onViewChange(key as ViewMode)}
              className={cn(
                "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-1",
                isActive
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-200"
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{config.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
