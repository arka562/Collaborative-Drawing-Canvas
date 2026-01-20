const board = document.querySelector("#canvas");
const pen = board.getContext("2d");

// ================== STATE ==================
const operations = [];
const remoteCursors = new Map();
let activeLine = null;
let lastCursorSent = 0;

// ================== CANVAS SETUP ==================
function fitCanvasToScreen() {
  board.width = window.innerWidth;
  board.height = window.innerHeight;
  redraw();
}

window.addEventListener("resize", fitCanvasToScreen);
fitCanvasToScreen();

// ================== INPUT ==================
board.addEventListener("pointerdown", beginLine);
board.addEventListener("pointermove", extendLine);
board.addEventListener("pointerup", completeLine);
board.addEventListener("pointerleave", completeLine);

// ================== DRAWING ==================
function beginLine(e) {
  const id = crypto.randomUUID();
  activeLine = {
    id,
    shade: currentTool === "eraser" ? "#ffffff" : currentColor,
    thickness: currentWidth,
    path: [{ x: e.clientX, y: e.clientY }]
  };
}

function extendLine(e) {
  if (!activeLine) return;

  const point = { x: e.clientX, y: e.clientY };
  activeLine.path.push(point);
  drawPartialLine(activeLine);

  // Cursor update (throttled)
  const now = Date.now();
  if (now - lastCursorSent > 30) {
    sendMessage({ type: "cursor:move", x: point.x, y: point.y });
    lastCursorSent = now;
  }
}

function completeLine() {
  if (!activeLine) return;

  sendMessage({ type: "stroke:end", stroke: activeLine });
  activeLine = null;
}

// ================== RENDERING ==================
function drawPartialLine(line) {
  const pts = line.path;
  if (pts.length < 2) return;

  const p1 = pts[pts.length - 2];
  const p2 = pts[pts.length - 1];

  pen.strokeStyle = line.shade;
  pen.lineWidth = line.thickness;
  pen.lineCap = "round";

  pen.beginPath();
  pen.moveTo(p1.x, p1.y);
  pen.quadraticCurveTo(
    p1.x, p1.y,
    (p1.x + p2.x) / 2,
    (p1.y + p2.y) / 2
  );
  pen.stroke();
}

function drawCompleteLine(op) {
  const pts = op.points;
  if (pts.length < 2) return;

  pen.strokeStyle = op.color;
  pen.lineWidth = op.width;
  pen.lineCap = "round";

  pen.beginPath();
  pen.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    pen.lineTo(pts[i].x, pts[i].y);
  }
  pen.stroke();
}

// ================== REDRAW ==================
function redraw() {
  pen.clearRect(0, 0, board.width, board.height);
  operations.forEach(op => {
    if (!op.undone) drawCompleteLine(op);
  });

  // Draw cursors
  remoteCursors.forEach(pos => {
    pen.fillStyle = "red";
    pen.beginPath();
    pen.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
    pen.fill();
  });
}

// ================== SERVER EVENTS ==================
function handleRemoteMessage(msg) {

  if (msg.type === "snapshot") {
    operations.length = 0;
    operations.push(...msg.operations);
    redraw();
  }

  if (msg.type === "commit") {
    operations.push(msg.operation);
    redraw();
  }

  if (msg.type === "undo") {
    const op = operations.find(o => o.id === msg.opId);
    if (op) {
      op.undone = true;
      redraw();
    }
  }

  if (msg.type === "redo") {
    const op = operations.find(o => o.id === msg.opId);
    if (op) {
      op.undone = false;
      redraw();
    }
  }

  if (msg.type === "cursor:move") {
    remoteCursors.set(msg.userId, { x: msg.x, y: msg.y });
    redraw();
  }

  if (msg.type === "user:leave") {
    remoteCursors.delete(msg.userId);
    redraw();
  }
}

// ================== GLOBAL SHORTCUTS ==================
window.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "z") sendMessage({ type: "undo" });
  if (e.ctrlKey && e.key === "y") sendMessage({ type: "redo" });
});
