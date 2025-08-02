import { useState } from "react";
import { Mic, Send, Plus, Check, Clock, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSpeech } from "@/hooks/use-speech";
import { useWebSocket } from "@/hooks/use-websocket";
import { cn } from "@/lib/utils";

interface VoiceInputBarProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function VoiceInputBar({ onSendMessage, disabled }: VoiceInputBarProps) {
  const [inputValue, setInputValue] = useState("");
  const { sendMessage } = useWebSocket();
  
  const { isListening, transcript, toggleListening, isSupported } = useSpeech({
    onResult: (result) => {
      if (result.isFinal) {
        setInputValue(result.transcript);
      }
    },
  });

  const handleSend = () => {
    const message = inputValue.trim();
    if (message) {
      onSendMessage(message);
      setInputValue("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (action: string) => {
    sendMessage({ type: "quick_action", data: { action } });
    
    const actionMessages = {
      task_done: "I just completed a task",
      need_time: "I need more time for the current task",
      break: "I'm taking a short break",
    };
    
    const message = actionMessages[action as keyof typeof actionMessages];
    if (message) {
      onSendMessage(message);
    }
  };

  const handleEmergency = () => {
    sendMessage({ 
      type: "emergency_alert", 
      data: { 
        message: "Emergency interruption requested",
        timestamp: new Date().toISOString()
      }
    });
  };

  return (
    <>
      {/* Main Input Bar */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-none sm:max-w-md bg-white border-t border-gray-200 p-2 sm:p-4">
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Voice Input Button */}
          <Button
            size="icon"
            className={cn(
              "w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-lg",
              isListening ? "bg-red-500 hover:bg-red-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white border border-blue-600"
            )}
            onClick={toggleListening}
            disabled={!isSupported || disabled}
          >
            <Mic className="text-white text-lg" />
          </Button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder={isListening ? "Listening..." : "Type or speak your update..."}
              value={inputValue || (isListening ? transcript : "")}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={disabled}
              className="w-full bg-gray-100 rounded-full px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-colors"
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={handleSend}
              disabled={!inputValue.trim() || disabled}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary transition-colors h-6 w-6"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Actions Menu */}
          <Button
            size="icon"
            variant="outline"
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full"
            disabled={disabled}
          >
            <Plus className="text-gray-600 h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center justify-center space-x-1 sm:space-x-2 mt-2 sm:mt-3">
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-full text-xs font-medium flex items-center space-x-1 shadow-lg"
            onClick={() => handleQuickAction("task_done")}
            disabled={disabled}
          >
            <Check className="h-3 w-3" />
            <span>Task Done</span>
          </Button>
          
          <Button
            size="sm"
            className="bg-orange-500 hover:bg-orange-600 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-full text-xs font-medium flex items-center space-x-1 shadow-lg"
            onClick={() => handleQuickAction("need_time")}
            disabled={disabled}
          >
            <Clock className="h-3 w-3" />
            <span>Need More Time</span>
          </Button>
          
          <Button
            size="sm"
            variant="secondary"
            className="bg-gray-500 hover:bg-gray-600 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-full text-xs font-medium flex items-center space-x-1"
            onClick={() => handleQuickAction("break")}
            disabled={disabled}
          >
            <Pause className="h-3 w-3" />
            <span>Break</span>
          </Button>
        </div>
      </div>

      {/* Emergency Button */}
      <Button
        size="icon"
        className="fixed bottom-24 right-4 w-14 h-14 bg-danger hover:bg-danger/90 rounded-full shadow-xl z-50"
        onClick={handleEmergency}
        disabled={disabled}
      >
        <span className="text-white text-xl font-bold">!</span>
      </Button>
    </>
  );
}
