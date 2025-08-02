import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export function AppHeader() {
  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const unacknowlediedCount = notifications.filter((n: any) => !n.acknowledged).length;

  return (
    <div className="bg-primary text-white p-3 sm:p-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-400 rounded-full flex items-center justify-center">
          <i className="fas fa-robot text-sm sm:text-lg"></i>
        </div>
        <div className="min-w-0">
          <h1 className="font-semibold text-sm sm:text-lg truncate">Assistant Pro</h1>
          <p className="text-blue-200 text-xs sm:text-sm hidden sm:block">Always here to help</p>
        </div>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="relative">
          <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
          {unacknowlediedCount > 0 && (
            <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-5 sm:h-5 bg-warning rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {unacknowlediedCount > 9 ? "9+" : unacknowlediedCount}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
