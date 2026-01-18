import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Serve static client files
app.use(express.static("client"));

// Store connected clients
const clients = new Map();

wss.on("connection", (ws) => {
  const clientId = uuidv4();
  clients.set(ws, clientId);

  console.log(`Client connected: ${clientId}`);

  ws.on("message", (data) => {
    const message = data.toString();

    // Broadcast to all OTHER clients
    for (const client of wss.clients) {
      if (client !== ws && client.readyState === client.OPEN) {
        client.send(message);
      }
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log(`Client disconnected: ${clientId}`);
  });
});

server.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
