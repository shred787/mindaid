import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AppHeader } from "@/components/layout/app-header";
import { ViewSelector } from "@/components/layout/view-selector";
import { VoiceInputBar } from "@/components/layout/voice-input-bar";
import { ChatInterface } from "@/components/chat/chat-interface";
import { CalendarView } from "@/components/views/calendar-view";
import { TimelineView } from "@/components/views/timeline-view";
import { CashFlowView } from "@/components/views/cashflow-view";
import { ViewMode } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewMode>("chat");
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const renderCurrentView = () => {
    switch (currentView) {
      case "chat":
        return <ChatInterface />;
      case "calendar":
        return <CalendarView />;
      case "gantt":
        return <TimelineView />;
      case "cashflow":
        return <CashFlowView />;
      default:
        return <ChatInterface />;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl relative">
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
