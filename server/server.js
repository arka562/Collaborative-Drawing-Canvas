import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";

import {
  operations,
  addOperation,
  undoOperation,
  redoOperation
} from "./drawing-state.js";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static("client"));

const users = new Map(); // ws -> userId

function broadcast(msg, exclude = null) {
  const payload = JSON.stringify(msg);
  wss.clients.forEach(client => {
    if (client !== exclude && client.readyState === client.OPEN) {
      client.send(payload);
    }
  });
}

wss.on("connection", (ws) => {
  const userId = uuidv4();
  users.set(ws, userId);

  console.log("Client connected:", userId);

  // Notify others
  broadcast({ type: "user:join", userId });

  // Send snapshot to late joiner
  ws.send(JSON.stringify({
    type: "snapshot",
    operations
  }));

  ws.on("message", (data) => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }

    if (msg.type === "stroke:end") {
      const op = {
        id: msg.stroke.id,
        userId,
        color: msg.stroke.shade,
        width: msg.stroke.thickness,
        points: msg.stroke.path,
        undone: false,
        timestamp: Date.now()
      };

      addOperation(op);
      broadcast({ type: "commit", operation: op });
    }

    if (msg.type === "undo") {
      const id = undoOperation();
      if (id) broadcast({ type: "undo", opId: id });
    }

    if (msg.type === "redo") {
      const id = redoOperation();
      if (id) broadcast({ type: "redo", opId: id });
    }

    if (msg.type === "cursor:move") {
      broadcast({ ...msg, userId }, ws);
    }
  });

  ws.on("close", () => {
    users.delete(ws);
    console.log("Client disconnected:", userId);
    broadcast({ type: "user:leave", userId });
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
