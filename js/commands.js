import { getTask, addTask, putTask, deleteTask } from "./db.js";
import { logMessage } from "./utility.js";

const taskListContainer = document.getElementById("task-list");

class Command {
  execute() {}
  undo() {}
}

class TaskCommand extends Command {
  constructor(taskId) {
    super();
    this.taskId = taskId;
  }
}

export class CreateTaskCommand extends TaskCommand {
  constructor(task) {
    super(task.id);
    this.task = task;
  }

  async execute() {
    await addTask("tasks", "readwrite", this.task);
    document.dispatchEvent(
      new CustomEvent("task-created", {
        detail: { taskId: this.taskId, task: this.task },
      })
    );
  }

  async undo() {
    await deleteTask("tasks", "readwrite", this.taskId);
    document.dispatchEvent(
      new CustomEvent("task-deleted", { detail: { taskId: this.taskId } })
    );
  }
}

export class DeleteTaskCommand extends TaskCommand {
  constructor(taskId, task) {
    super(taskId);
    this.task = task;
  }

  async execute() {
    await deleteTask("tasks", "readwrite", this.taskId);
    document.dispatchEvent(
      new CustomEvent("task-deleted", { detail: { taskId: this.taskId } })
    );
  }

  async undo() {
    await addTask("tasks", "readwrite", this.task);
    document.dispatchEvent(
      new CustomEvent("task-created", {
        detail: { taskId: this.taskId, task: this.task },
      })
    );
  }
}

export class UpdateTaskCommand extends TaskCommand {
  constructor(taskId, prevData, newData) {
    super(taskId);
    this.prevData = prevData;
    this.newData = newData;
  }

  async execute() {
    await putTask("tasks", "readwrite", this.newData);
    document.dispatchEvent(
      new CustomEvent("task-updated", {
        detail: {
          taskId: this.taskId,
          task: this.newData,
        },
      })
    );
  }

  async undo() {
    await putTask("tasks", "readwrite", this.prevData);
    document.dispatchEvent(
      new CustomEvent("task-updated", {
        detail: {
          taskId: this.taskId,
          task: this.prevData,
        },
      })
    );
  }
}

export class ReorderTaskCommand extends TaskCommand {
  constructor(taskId) {
    super(null);
    this.taskId = taskId;
    this.newPosition = null;
    this.prevPosition = null;
    this.reorderedData = [];
  }

  async execute() {
    try {
      const tasksList = [...taskListContainer.children];
      const taskIndex = tasksList.findIndex(
        (task) => task.id === `task-item-${this.taskId}`
      );
      if (taskIndex === -1) return;
      this.newPosition = taskIndex;

      const taskData = await getTask("tasks", "readonly", this.taskId);
      this.prevPosition = taskData.position;

      if (this.prevPosition === this.newPosition) return;

      const start = Math.min(this.prevPosition, this.newPosition);
      const end = Math.max(this.prevPosition, this.newPosition);

      const affectedTasks = await Promise.all(
        tasksList.slice(start, end + 1).map(async (taskItem) => {
          const [, taskId] = taskItem.id.split("task-item-");
          return await getTask("tasks", "readonly", taskId);
        })
      );

      // Adjust positions
      for (const task of affectedTasks) {
        if (task.id === this.taskId) {
          task.position = this.newPosition;
        } else if (this.prevPosition < this.newPosition) {
          task.position -= 1;
        } else {
          task.position += 1;
        }

        this.reorderedData.push({
          taskId: task.id,
          prevPos: task.position,
          newPos: task.position,
        });
      }

      await Promise.all(
        affectedTasks.map((task) => putTask("tasks", "readwrite", task))
      );
    } catch (error) {
      logMessage("error", "Error in updating tasks order", error);
    }
  }

  async undo() {
    try {
      if (!this.reorderedData.length) return;

      await Promise.all(
        this.reorderedData.map(async ({ taskId, prevPos }) => {
          const task = await getTask("tasks", "readonly", taskId);
          task.position = prevPos;
          await putTask("tasks", "readwrite", task);
        })
      );

      // reload the current page
      window.location.reload();
    } catch (error) {
      logMessage("error", "Error in undoing task reorder", error);
    }
  }
}
