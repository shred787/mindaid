import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

interface HardAlert {
  id: string;
  title: string;
  message: string;
  priority: number;
  dismissible: boolean;
  actionRequired: boolean;
  relatedTaskId?: string;
  relatedProjectId?: string;
  createdAt: string;
}

export function HardAlertOverlay() {
  const [alerts, setAlerts] = useState<HardAlert[]>([]);
  const [alertSound] = useState(() => {
    const audio = new Audio();
    audio.src = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N+QQAoUXrTp66hVFApGn+DyvmgeBC2Dy/LFeSsFLoXP8tmSQAYWYrjr7KdWEgU+ldPyyncFLoLM8dmRQAYWYbjr7KdVEgQ8ltDyuncELILM8NmRQAYWYrnp7KdVEgQ8lc/zynsEK4DN8N+SQQYXYrTq66pXEQU9lNH0zYAFL4PL8N6PQQYYYrrq7KhVEgU9ldDy0YAFL4LM8N+QQQYXY7Tq66hWEQQ9lNDzzIAEL4LL8N6PQQYXYrTq66hXEQU9ldHy0H8GMwAAAAAAAEAfAABBHQAOCb2W";
    return audio;
  });

  const { data: hardAlerts, refetch } = useQuery<HardAlert[]>({
    queryKey: ["/api/alerts/hard"],
    refetchInterval: 5000, // Check every 5 seconds
  });

  useEffect(() => {
    if (hardAlerts && hardAlerts.length > alerts.length) {
      // New alert detected - play sound
      alertSound.play().catch(() => {
        // Fallback for browsers that block autoplay
        console.log("Alert sound blocked by browser");
      });
    }
    setAlerts(hardAlerts || []);
  }, [hardAlerts, alerts.length, alertSound]);

  if (!alerts.length) return null;

  return (
    <div className="fixed inset-0 z-50 bg-red-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-4">
        {alerts.map((alert) => (
          <Card 
            key={alert.id} 
            className={cn(
              "border-red-500 bg-red-50 dark:bg-red-950/50 shadow-2xl",
              "animate-pulse" // Pulsing effect for urgency
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                  <div>
                    <CardTitle className="text-red-700 dark:text-red-300 text-lg">
                      {alert.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="destructive">Priority {alert.priority}</Badge>
                      {alert.actionRequired && (
                        <Badge variant="outline" className="border-orange-500 text-orange-700">
                          Action Required
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {new Date(alert.createdAt).toLocaleTimeString()}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <AlertDescription className="text-red-800 dark:text-red-200 text-base mb-4">
                {alert.message}
              </AlertDescription>
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  This is a hard alert that requires immediate attention
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (alert.relatedTaskId) {
                        // Navigate to task (implement navigation logic)
                        window.location.hash = `#task-${alert.relatedTaskId}`;
                      }
                    }}
                  >
                    View Task
                  </Button>
                  
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={async () => {
                      // Acknowledge the alert
                      try {
                        await apiRequest('POST', `/api/notifications/${alert.id}/acknowledge`);
                        refetch();
                      } catch (error) {
                        console.error('Failed to acknowledge alert:', error);
                      }
                    }}
                  >
                    I'll Handle This
                  </Button>
                </div>
              </div>
              
              {/* Warning about dismissibility */}
              {!alert.dismissible && (
                <Alert className="mt-4 border-orange-500 bg-orange-50 dark:bg-orange-950/20">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <AlertDescription className="text-orange-700 dark:text-orange-300">
                    This alert cannot be dismissed until action is taken
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}