import { Bell, User, Settings, LogOut, Target, BarChart3, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "wouter";

export function AppHeader() {
  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: overview } = useQuery({
    queryKey: ["/api/overview"],
    refetchInterval: 60000, // Refetch every minute
  });

  const unacknowledgedCount = (notifications as any[]).filter((n: any) => !n.acknowledged).length;

  // Mock user data - in real app would come from auth context
  const user = {
    firstName: "Alex",
    lastName: "Johnson",
    email: "alex.johnson@email.com",
    profileImage: "",
    jobTitle: "Senior Consultant",
    accountabilityScore: 85
  };

  const getInitials = () => {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  };

  const getAccountabilityColor = () => {
    if (user.accountabilityScore >= 80) return "text-green-600";
    if (user.accountabilityScore >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const formatNotificationTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="app-header-primary p-3 sm:p-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      {/* Logo and Title */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        <Link href="/">
          <div className="flex items-center cursor-pointer hover:opacity-80 transition-opacity">
            <div className="min-w-0">
              <h1 className="font-bold text-sm sm:text-lg text-primary-foreground truncate">Productivity Pro</h1>
              <p className="text-primary-foreground/70 text-xs sm:text-sm hidden sm:block">Productivity Pro Accountability System</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Right Side - Notifications and Profile */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Quick Stats (Desktop Only) */}
        <div className="hidden lg:flex items-center space-x-4 px-3 py-1 bg-primary-foreground/10 rounded-lg">
          <div className="text-center">
            <div className="text-xs font-medium text-primary-foreground">{overview?.taskCount || 0}</div>
            <div className="text-xs text-primary-foreground/70">Tasks</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-medium text-primary-foreground">{overview?.completedTasksToday || 0}</div>
            <div className="text-xs text-primary-foreground/70">Today</div>
          </div>
          <div className="text-center">
            <div className={`text-xs font-medium ${getAccountabilityColor()}`}>{user.accountabilityScore}%</div>
            <div className="text-xs text-primary-foreground/70">Score</div>
          </div>
        </div>

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="relative p-2 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10">
              <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
              {unacknowledgedCount > 0 && (
                <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-5 sm:h-5 bg-destructive rounded-full flex items-center justify-center">
                  <span className="text-destructive-foreground text-xs font-bold">
                    {unacknowledgedCount > 9 ? "9+" : unacknowledgedCount}
                  </span>
                </div>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Notifications</h3>
              <p className="text-sm text-muted-foreground">
                {unacknowledgedCount > 0 ? `${unacknowledgedCount} unread` : "All caught up"}
              </p>
            </div>
            <ScrollArea className="h-96">
              {notifications.length > 0 ? (
                <div className="p-2">
                  {(notifications as any[]).map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                        !notification.acknowledged
                          ? "bg-muted/50 border-l-4 border-l-primary"
                          : "hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <div className="flex items-center space-x-2">
                          {notification.priority >= 4 && (
                            <Badge variant="destructive" className="text-xs">
                              Urgent
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatNotificationTime(notification.timestamp || notification.createdAt)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications yet</p>
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="p-2 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10">
              <User className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user.profileImage} />
                  <AvatarFallback className="font-bold">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium">{user.firstName} {user.lastName}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                  <div className={`text-xs font-medium ${getAccountabilityColor()}`}>
                    Accountability: {user.accountabilityScore}%
                  </div>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <Link href="/profile">
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile Settings</span>
              </DropdownMenuItem>
            </Link>
            
            <Link href="/business-profile">
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Business Profile</span>
              </DropdownMenuItem>
            </Link>
            
            <DropdownMenuItem className="cursor-pointer">
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>Performance Analytics</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
