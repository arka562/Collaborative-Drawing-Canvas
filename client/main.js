// Tool state
let currentTool = "brush";
let currentColor = "#000000";
let currentWidth = 4;

// UI elements
const colorPicker = document.getElementById("colorPicker");
const widthPicker = document.getElementById("widthPicker");
const brushBtn = document.getElementById("brushBtn");
const eraserBtn = document.getElementById("eraserBtn");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");

// Bind UI
colorPicker.onchange = (e) => currentColor = e.target.value;
widthPicker.onchange = (e) => currentWidth = Number(e.target.value);

brushBtn.onclick = () => currentTool = "brush";
eraserBtn.onclick = () => currentTool = "eraser";

undoBtn.onclick = () => undo();
redoBtn.onclick = () => redo();

initWebSocket();
