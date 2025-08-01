import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export function AppHeader() {
  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const unacknowlediedCount = notifications.filter((n: any) => !n.acknowledged).length;

  return (
    <div className="bg-primary text-white p-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center">
          <i className="fas fa-robot text-lg"></i>
        </div>
        <div>
          <h1 className="font-semibold text-lg">Assistant Pro</h1>
          <p className="text-blue-200 text-sm">Always here to help</p>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <div className="relative">
          <Bell className="text-xl" />
          {unacknowlediedCount > 0 && (
            <div className="absolute -top-2 -right-2 w-5 h-5 bg-warning rounded-full flex items-center justify-center">
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
