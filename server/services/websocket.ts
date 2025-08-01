import { WebSocketServer, WebSocket } from "ws";
import { storage } from "../storage";

interface WebSocketMessage {
  type: string;
  data: any;
}

export function setupWebSocket(wss: WebSocketServer) {
  wss.on("connection", (ws: WebSocket) => {
    console.log("WebSocket client connected");

    ws.on("message", async (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        
        switch (message.type) {
          case "ping":
            ws.send(JSON.stringify({ type: "pong" }));
            break;
            
          case "task_update":
            // Handle real-time task updates
            const { taskId, updates } = message.data;
            await storage.updateTask(taskId, updates);
            
            // Broadcast update to all connected clients
            wss.clients.forEach((client) => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: "task_updated",
                  data: { taskId, updates }
                }));
              }
            });
            break;
            
          case "emergency_alert":
            // Handle emergency interruption
            console.log("Emergency alert triggered:", message.data);
            
            // Broadcast emergency to all clients
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: "emergency",
                  data: message.data
                }));
              }
            });
            break;
            
          case "voice_command":
            // Handle voice commands
            console.log("Voice command received:", message.data);
            // Process and respond to voice commands
            break;
            
          default:
            console.log("Unknown message type:", message.type);
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
        ws.send(JSON.stringify({ 
          type: "error", 
          data: { message: "Invalid message format" }
        }));
      }
    });

    ws.on("close", () => {
      console.log("WebSocket client disconnected");
    });
  });

  // Periodic check-ins (heartbeat)
  setInterval(() => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ 
          type: "heartbeat", 
          timestamp: new Date().toISOString()
        }));
      }
    });
  }, 30000); // Every 30 seconds
}
