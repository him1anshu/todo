class UndoRedoManager {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
  }

  async execute(command) {
    await command.execute();
    this.undoStack.push(command);
    this.redoStack = [];
  }

  async undo() {
    if (this.undoStack.length === 0) return;
    const command = this.undoStack.pop();
    await command.undo();
    this.redoStack.push(command);
  }

  async redo() {
    if (this.redoStack.length === 0) return;
    const command = this.redoStack.pop();
    await command.execute();
    this.undoStack.push(command);
  }
}

export const undoRedoManager = new UndoRedoManager();
