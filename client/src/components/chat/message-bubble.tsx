import { ChatMessage } from "@/types";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const timestamp = new Date(message.timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className={cn(
      "flex items-start space-x-3",
      isUser ? "flex-row-reverse space-x-reverse" : ""
    )}>
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
        isUser ? "bg-gray-300" : "bg-primary"
      )}>
        {isUser ? (
          <User className="text-gray-600 text-sm" />
        ) : (
          <Bot className="text-white text-sm" />
        )}
      </div>

      {/* Message Content */}
      <div className="flex-1">
        <div className={cn(
          "rounded-xl p-3 max-w-xs",
          isUser 
            ? "bg-primary text-white rounded-tr-sm ml-auto" 
            : "bg-gray-100 text-gray-800 rounded-tl-sm"
        )}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
        <p className={cn(
          "text-xs text-gray-500 mt-1",
          isUser ? "text-right" : ""
        )}>
          {timestamp}
        </p>
      </div>
    </div>
  );
}
