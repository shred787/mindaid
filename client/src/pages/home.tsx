import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/layout/app-header";
import { ViewSelector } from "@/components/layout/view-selector";
import { VoiceInputBar } from "@/components/layout/voice-input-bar";
import { ChatInterface } from "@/components/chat/chat-interface";
import { CalendarView } from "@/components/views/calendar-view";
import { TimelineView } from "@/components/views/timeline-view";

import { HardAlertOverlay } from "@/components/alerts/hard-alert-overlay";

import { CheckInSystem } from "@/components/accountability/check-in-system";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { ViewMode } from "@/types";
import { Task, Client } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewMode>("chat");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if this is a new user who needs onboarding
  const { data: tasks = [] } = useQuery<Task[]>({ queryKey: ["/api/tasks"] });
  const { data: clients = [] } = useQuery<Client[]>({ queryKey: ["/api/clients"] });
  
  // Show onboarding if no tasks and no clients exist
  const needsOnboarding = tasks.length === 0 && clients.length === 0;

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", "/api/messages", {
        role: "user",
        content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/overview"] });
      toast({
        title: "Message sent",
        description: "Your message has been processed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (message: string) => {
    sendMessageMutation.mutate(message);
  };

  // Show onboarding wizard for new users
  if (needsOnboarding && !showOnboarding) {
    return (
      <div className="min-h-screen bg-background">
        <OnboardingWizard onComplete={() => setShowOnboarding(true)} />
      </div>
    );
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case "chat":
        return <ChatInterface onNavigate={setCurrentView} />;
      case "calendar":
        return <CalendarView />;
      case "gantt":
        return <TimelineView />;


      case "accountability":
        return <CheckInSystem />;
      default:
        return <ChatInterface onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="w-full max-w-none sm:max-w-md mx-auto bg-background min-h-screen shadow-none sm:shadow-xl relative">
      <HardAlertOverlay />
      <AppHeader />
      <ViewSelector currentView={currentView} onViewChange={setCurrentView} />
      {renderCurrentView()}
      <VoiceInputBar 
        onSendMessage={handleSendMessage}
        disabled={sendMessageMutation.isPending}
      />
    </div>
  );
}
