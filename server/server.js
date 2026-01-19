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

function broadcast(msg) {
  const payload = JSON.stringify(msg);
  wss.clients.forEach(client => {
    if (client.readyState === client.OPEN) {
      client.send(payload);
    }
  });
}

wss.on("connection", (ws) => {
  const userId = uuidv4();
  console.log("Client connected:", userId);

  // Send existing state to late joiner
  ws.send(JSON.stringify({
    type: "snapshot",
    operations
  }));

  ws.on("message", (data) => {
    const msg = JSON.parse(data.toString());

    // FINALIZED STROKE
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

      broadcast({
        type: "commit",
        operation: op
      });
    }

    // GLOBAL UNDO
    if (msg.type === "undo") {
      const id = undoOperation();
      if (id) {
        broadcast({ type: "undo", opId: id });
      }
    }

    // GLOBAL REDO
    if (msg.type === "redo") {
      const id = redoOperation();
      if (id) {
        broadcast({ type: "redo", opId: id });
      }
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected:", userId);
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
