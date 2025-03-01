import { addTask, putTask, deleteTask } from "./db.js";
import { attachDragHandlerToTaskItem, sortTasks } from "./task-manager.js";
import { renderTask } from "./ui.js";
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
    const fragment = document.createDocumentFragment();
    const taskFilter = document.querySelector("#task-filter");
    const sortBy = document.querySelector("#sort-by");

    if (taskFilter.value !== "completed") {
      if (sortBy.value) {
        await sortTasks(sortBy.value);
      } else {
        const taskItem = renderTask(this.task);
        attachDragHandlerToTaskItem(this.taskId, taskItem);
        fragment.appendChild(taskItem);
      }
    }

    taskListContainer.appendChild(fragment);
  }

  async undo() {
    await deleteTask("tasks", "readwrite", this.task.id);
  }
}

export class DeleteTaskCommand extends TaskCommand {
  constructor(taskId, taskData) {
    super(taskId);
    this.taskData = taskData;
  }

  async execute() {
    await deleteTask("tasks", "readwrite", this.taskId);
    document.getElementById(`task-item-${this.taskId}`)?.remove();
  }

  async undo() {
    await addTask("tasks", "readwrite", this.taskData);
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
    const taskItem = document.getElementById(`task-item-${this.taskId}`);
    if (taskItem) {
      const sortBy = document.querySelector("#sort-by");
      let isDraggable = true;
      if (sortBy.value) {
        isDraggable = false;
      }

      const newTaskItem = renderTask(this.newData);
      attachDragHandlerToTaskItem(this.taskId, newTaskItem, isDraggable);
      taskListContainer.replaceChild(newTaskItem, taskItem);
    }
  }

  async undo() {
    await putTask("tasks", "readwrite", this.prevData);
  }
}

export class ReorderTaskCommand extends TaskCommand {
  constructor(taskReorderedData) {
    super(null);
    this.reorderedData = taskReorderedData;
  }

  async execute() {}

  async undo() {}
}
