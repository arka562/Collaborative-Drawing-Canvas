const remoteStrokes = new Map();

const board = document.querySelector("#canvas");
const pen = board.getContext("2d");

// ================== APP DATA ==================
const strokeStore = [];
const redoStore = [];
let activeLine  = null;

// ================== CANVAS CONFIG ==================
function fitCanvasToScreen() {
  board.width = window.innerWidth;
  board.height = window.innerHeight;
  refreshBoard();
}

window.addEventListener("resize", fitCanvasToScreen);
fitCanvasToScreen();

// ================== INPUT LISTENERS ==================
board.addEventListener("pointerdown", beginLine);
board.addEventListener("pointermove", extendLine);
board.addEventListener("pointerup", completeLine);
board.addEventListener("pointerleave", completeLine);

// ================== LINE CREATION ==================
function beginLine(event) {
  const strokeId = crypto.randomUUID();

  activeLine = {
    id: strokeId,
    mode: currentTool,
    shade: currentTool === "eraser" ? "#ffffff" : currentColor,
    thickness: currentWidth,
    path: [{ x: event.clientX, y: event.clientY }]
  };

  sendMessage({
    type: "stroke:start",
    strokeId,
    mode: activeLine.mode,
    shade: activeLine.shade,
    thickness: activeLine.thickness,
    point: activeLine.path[0]
  });
}




function extendLine(event) {
  if (!activeLine) return;

  const point = { x: event.clientX, y: event.clientY };
  activeLine.path.push(point);
  drawPartialLine(activeLine);

  sendMessage({
    type: "stroke:move",
    strokeId: activeLine.id,
    point
  });
}



function completeLine() {
  if (!activeLine) return;

  strokeStore.push(activeLine);

  sendMessage({
    type: "stroke:end",
    strokeId: activeLine.id
  });

  redoStore.length = 0;
  activeLine = null;
}




// ================== RENDERING ==================
function drawPartialLine(line) {
  const points = line.path;
  if (points.length < 2) return;

  const prevPoint = points[points.length - 2];
  const currPoint = points[points.length - 1];

  pen.strokeStyle = line.shade;
  pen.lineWidth = line.thickness;
  pen.lineCap = "round";
  pen.lineJoin = "round";

  pen.beginPath();
  pen.moveTo(prevPoint.x, prevPoint.y);
  pen.quadraticCurveTo(
    prevPoint.x,
    prevPoint.y,
    (prevPoint.x + currPoint.x) / 2,
    (prevPoint.y + currPoint.y) / 2
  );
  pen.stroke();
}

function drawCompleteLine(line) {
  const points = line.path;
  if (points.length < 2) return;

  pen.strokeStyle = line.shade;
  pen.lineWidth = line.thickness;
  pen.lineCap = "round";

  pen.beginPath();
  pen.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    pen.lineTo(points[i].x, points[i].y);
  }

  pen.stroke();
}

// ================== REPAINT ==================
function refreshBoard() {
  pen.clearRect(0, 0, board.width, board.height);
  strokeStore.forEach(drawCompleteLine);
}

// ================== HISTORY CONTROLS ==================
function rollback() {
  if (!strokeStore.length) return;
  redoStore.push(strokeStore.pop());
  refreshBoard();
}

function restore() {
  if (!redoStore.length) return;
  strokeStore.push(redoStore.pop());
  refreshBoard();
}

// ================== SHORTCUT KEYS ==================
window.addEventListener("keydown", (event) => {
  if (event.ctrlKey && event.key === "z") rollback();
  if (event.ctrlKey && event.key === "y") restore();
});

function handleRemoteMessage(msg) {

  if (msg.type === "stroke:start") {
    remoteStrokes.set(msg.strokeId, {
      mode: msg.mode,
      shade: msg.shade,
      thickness: msg.thickness,
      path: [msg.point]
    });
  }

  if (msg.type === "stroke:move") {
    const line = remoteStrokes.get(msg.strokeId);
    if (!line) return;

    line.path.push(msg.point);
    drawPartialLine(line);
  }

  if (msg.type === "stroke:end") {
    const line = remoteStrokes.get(msg.strokeId);
    if (!line) return;

    strokeStore.push(line);
    remoteStrokes.delete(msg.strokeId);
  }
}
