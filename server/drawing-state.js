export const operations = [];
export const undoStack = [];

// Add finalized stroke
export function addOperation(op) {
  operations.push(op);
  undoStack.length = 0; // clear redo history
}

// Undo = mark last non-undone op
export function undoOperation() {
  for (let i = operations.length - 1; i >= 0; i--) {
    if (!operations[i].undone) {
      operations[i].undone = true;
      undoStack.push(operations[i].id);
      return operations[i].id;
    }
  }
  return null;
}

// Redo = unmark last undone
export function redoOperation() {
  if (!undoStack.length) return null;

  const id = undoStack.pop();
  const op = operations.find(o => o.id === id);
  if (op) {
    op.undone = false;
    return id;
  }
  return null;
}
