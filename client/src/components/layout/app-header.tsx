import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export function AppHeader() {
  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const unacknowledgedCount = (notifications as any[]).filter((n: any) => !n.acknowledged).length;

  return (
    <div className="app-header-primary p-3 sm:p-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-foreground/10 rounded-full flex items-center justify-center">
          <div className="w-4 h-4 sm:w-5 sm:h-5 bg-primary-foreground rounded-sm"></div>
        </div>
        <div className="min-w-0">
          <h1 className="font-bold text-sm sm:text-lg truncate">Productivity Pro</h1>
          <p className="text-primary-foreground/70 text-xs sm:text-sm hidden sm:block">Task & Evidence Tracker</p>
        </div>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="relative">
          <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground/80" />
          {unacknowledgedCount > 0 && (
            <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-5 sm:h-5 bg-destructive rounded-full flex items-center justify-center">
              <span className="text-destructive-foreground text-xs font-bold">
                {unacknowledgedCount > 9 ? "9+" : unacknowledgedCount}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
