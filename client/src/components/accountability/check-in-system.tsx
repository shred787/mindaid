import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Clock, AlertCircle, TrendingUp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface CheckIn {
  id: string;
  type: "daily" | "weekly" | "project_milestone" | "emergency";
  prompt: string;
  response?: string;
  mood?: number;
  productivity?: number;
  blockers?: string;
  wins?: string;
  nextSteps?: string;
  completed: boolean;
  dueAt: string;
  completedAt?: string;
  createdAt: string;
}

const checkInResponseSchema = z.object({
  response: z.string().min(1, "Response is required"),
  mood: z.number().min(1).max(5),
  productivity: z.number().min(1).max(5),
  blockers: z.string().optional(),
  wins: z.string().optional(),
  nextSteps: z.string().min(1, "Next steps are required"),
});

type CheckInResponse = z.infer<typeof checkInResponseSchema>;

export function CheckInSystem() {
  const [selectedCheckIn, setSelectedCheckIn] = useState<CheckIn | null>(null);
  const queryClient = useQueryClient();

  const { data: pendingCheckIns } = useQuery<CheckIn[]>({
    queryKey: ["/api/checkins", { completed: false }],
    refetchInterval: 30000, // Check every 30 seconds
  });

  const { data: overdueCheckIns } = useQuery<CheckIn[]>({
    queryKey: ["/api/checkins/overdue"],
    refetchInterval: 30000,
  });

  const { data: recentCheckIns } = useQuery<CheckIn[]>({
    queryKey: ["/api/checkins", { completed: true }],
  });

  const form = useForm<CheckInResponse>({
    resolver: zodResolver(checkInResponseSchema),
    defaultValues: {
      response: "",
      mood: 3,
      productivity: 3,
      blockers: "",
      wins: "",
      nextSteps: "",
    },
  });

  const completeCheckInMutation = useMutation({
    mutationFn: async (data: { id: string; response: CheckInResponse }) => {
      const response = await fetch(`/api/checkins/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data.response,
          completed: true,
          completedAt: new Date().toISOString(),
        }),
      });
      if (!response.ok) throw new Error("Failed to complete check-in");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checkins"] });
      setSelectedCheckIn(null);
      form.reset();
    },
  });

  const handleCompleteCheckIn = (data: CheckInResponse) => {
    if (selectedCheckIn) {
      completeCheckInMutation.mutate({
        id: selectedCheckIn.id,
        response: data,
      });
    }
  };

  const getCheckInTypeColor = (type: string) => {
    switch (type) {
      case "daily": return "bg-blue-100 text-blue-800";
      case "weekly": return "bg-green-100 text-green-800";
      case "project_milestone": return "bg-purple-100 text-purple-800";
      case "emergency": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getMoodIcon = (mood: number) => {
    if (mood >= 4) return "😊";
    if (mood >= 3) return "😐";
    return "😞";
  };

  const getProductivityIcon = (productivity: number) => {
    if (productivity >= 4) return "🚀";
    if (productivity >= 3) return "⚡";
    return "🐌";
  };

  return (
    <div className="space-y-6">
      {/* Overdue Alerts */}
      {overdueCheckIns && overdueCheckIns.length > 0 && (
        <Alert className="border-red-500 bg-red-50 dark:bg-red-950/20">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700 dark:text-red-300">
            You have {overdueCheckIns.length} overdue check-in{overdueCheckIns.length !== 1 ? 's' : ''}. 
            Please complete them to maintain accountability.
          </AlertDescription>
        </Alert>
      )}

      {/* Pending Check-ins */}
      {pendingCheckIns && pendingCheckIns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Check-ins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingCheckIns.map((checkIn) => (
                <div 
                  key={checkIn.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getCheckInTypeColor(checkIn.type)}>
                        {checkIn.type.replace('_', ' ')}
                      </Badge>
                      {new Date(checkIn.dueAt) < new Date() && (
                        <Badge variant="destructive">Overdue</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Due: {new Date(checkIn.dueAt).toLocaleString()}
                    </p>
                    <p className="font-medium">{checkIn.prompt}</p>
                  </div>
                  <Button 
                    onClick={() => setSelectedCheckIn(checkIn)}
                    size="sm"
                  >
                    Complete
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Check-ins */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Recent Check-ins
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentCheckIns && recentCheckIns.length > 0 ? (
            <div className="space-y-3">
              {recentCheckIns.slice(0, 5).map((checkIn) => (
                <div key={checkIn.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={getCheckInTypeColor(checkIn.type)}>
                      {checkIn.type.replace('_', ' ')}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(checkIn.completedAt!).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <p className="text-sm mb-2">{checkIn.prompt}</p>
                  
                  {checkIn.response && (
                    <div className="bg-muted p-2 rounded text-sm mb-2">
                      {checkIn.response}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm">
                    {checkIn.mood && (
                      <span>Mood: {getMoodIcon(checkIn.mood)} {checkIn.mood}/5</span>
                    )}
                    {checkIn.productivity && (
                      <span>Productivity: {getProductivityIcon(checkIn.productivity)} {checkIn.productivity}/5</span>
                    )}
                  </div>
                  
                  {checkIn.wins && (
                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/20 rounded text-sm">
                      <strong>Wins:</strong> {checkIn.wins}
                    </div>
                  )}
                  
                  {checkIn.blockers && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/20 rounded text-sm">
                      <strong>Blockers:</strong> {checkIn.blockers}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No completed check-ins yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Check-in Form Modal */}
      {selectedCheckIn && (
        <Dialog open={true} onOpenChange={() => setSelectedCheckIn(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Complete Check-in</DialogTitle>
            </DialogHeader>

            <div className="mb-4 p-3 bg-muted rounded">
              <Badge className={getCheckInTypeColor(selectedCheckIn.type)}>
                {selectedCheckIn.type.replace('_', ' ')}
              </Badge>
              <p className="mt-2 font-medium">{selectedCheckIn.prompt}</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCompleteCheckIn)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="response"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Response</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Share your current status, progress, and thoughts..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="mood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mood (1-5)</FormLabel>
                        <FormControl>
                          <div className="px-3">
                            <Slider
                              min={1}
                              max={5}
                              step={1}
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                            />
                            <div className="flex justify-between text-sm text-muted-foreground mt-1">
                              <span>😞</span>
                              <span>😐</span>
                              <span>😊</span>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="productivity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Productivity (1-5)</FormLabel>
                        <FormControl>
                          <div className="px-3">
                            <Slider
                              min={1}
                              max={5}
                              step={1}
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                            />
                            <div className="flex justify-between text-sm text-muted-foreground mt-1">
                              <span>🐌</span>
                              <span>⚡</span>
                              <span>🚀</span>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="wins"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wins & Achievements</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What went well? What are you proud of?"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="blockers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blockers & Challenges</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What's slowing you down? What challenges are you facing?"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nextSteps"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Next Steps</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What will you focus on next? What's your plan moving forward?"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setSelectedCheckIn(null)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={completeCheckInMutation.isPending}
                  >
                    {completeCheckInMutation.isPending ? "Submitting..." : "Complete Check-in"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}