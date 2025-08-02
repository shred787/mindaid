import { ViewMode } from "@/types";
import { MessageCircle, Calendar, BarChart3, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewSelectorProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

const viewConfig = {
  chat: { icon: MessageCircle, label: "Chat" },
  calendar: { icon: Calendar, label: "Calendar" },
  gantt: { icon: BarChart3, label: "Timeline" },
  accountability: { icon: Shield, label: "Check-ins" },
};

export function ViewSelector({ currentView, onViewChange }: ViewSelectorProps) {
  return (
    <div className="bg-background dark:bg-background border-b border-border px-2 sm:px-4 py-3">
      <div className="flex space-x-1 bg-muted rounded-lg p-1.5">
        {Object.entries(viewConfig).map(([key, config]) => {
          const Icon = config.icon;
          const isActive = currentView === key;
          
          return (
            <button
              key={key}
              onClick={() => onViewChange(key as ViewMode)}
              className={cn(
                "flex-1 py-2 sm:py-2.5 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center",
                "min-w-0 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                isActive
                  ? "view-selector-active shadow-sm"
                  : "view-selector-inactive"
              )}
            >
              <Icon className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="ml-1.5 truncate hidden xs:inline">{config.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
