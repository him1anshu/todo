// import { renderTask } from "./ui.js";
// import { sortTasks } from "./task-manager.js";
// import { getObjectStore, renderAllTasks } from "./db.js";
import { logMessage } from "./utility";

const taskListContainer = document.getElementById("task-list");

const undoStack = [];
let redoStack = [];

export function pushDataToStack(taskEvent) {
  redoStack = [];

  if (undoStack.length === 50) {
    undoStack.shift();
  }

  undoStack.push(taskEvent);
}

function removeTask(taskEvent, isRedoEvent = true) {
  const objectStore = getObjectStore("tasks", "readwrite");
  const request = objectStore.delete(taskEvent.taskId);
  request.addEventListener("success", (event) => {
    document.getElementById(`task-item-${taskEvent.taskId}`)?.remove();
    if (isRedoEvent) {
      undoStack.push({
        name: "task-deleted",
        taskId: taskEvent.taskId,
        data: taskEvent.data,
      });
    } else {
      redoStack.push({
        name: "task-deleted",
        taskId: taskEvent.taskId,
        data: taskEvent.data,
      });
    }
  });
}

function updateTask(taskEvent, isRedoEvent = true) {
  const objectStore = getObjectStore("tasks", "readwrite");
  const request = objectStore.put(taskEvent.prevData);
  request.addEventListener("success", () => {
    if (isRedoEvent) {
      undoStack.push({
        name: "task-updated",
        taskId: taskEvent.taskId,
        prevData: taskEvent.newData,
        newData: taskEvent.prevData,
      });
    } else {
      redoStack.push({
        name: "task-updated",
        taskId: taskEvent.taskId,
        prevData: taskEvent.newData,
        newData: taskEvent.prevData,
      });
    }
  });
}

function createTask(taskEvent, isRedoEvent = true) {
  const objectStore = getObjectStore("tasks", "readwrite");
  const request = objectStore.add(taskEvent.data);
  request.addEventListener("success", async () => {
    const taskFilter = document.querySelector("#task-filter");
    const sortBy = document.querySelector("#sort-by");
    if (taskFilter.value !== "completed") {
      if (sortBy.value) {
        await sortTasks(sortBy.value);
      } else {
        taskListContainer.appendChild(renderTask(taskEvent.data));
      }
    }

    if (isRedoEvent) {
      undoStack.push({
        name: "task-created",
        taskId: taskEvent.taskId,
        data: taskEvent.data,
      });
    } else {
      redoStack.push({
        name: "task-created",
        taskId: taskEvent.taskId,
        data: taskEvent.data,
      });
    }
  });
}

function reorderTask(taskEvent, isRedoEvent = true) {
  const objectStore = getObjectStore("tasks", "readwrite");
  const taskReorderedData = [];
  for (const taskItem of taskEvent.data) {
    const { taskId, prevPos, newPos } = taskItem;
    const request = objectStore.get(taskId);
    request.addEventListener("success", async (event) => {
      const task = { ...event.target.result };
      task.position = prevPos;

      taskReorderedData.push({
        taskId: task.id,
        prevPos: newPos,
        newPos: task.position,
      });

      if (taskEvent.data.at(-1).taskId === taskId) {
        if (isRedoEvent) {
          undoStack.push({
            name: "task-reordered",
            data: taskReorderedData,
          });
        } else {
          redoStack.push({
            name: "task-reordered",
            data: taskReorderedData,
          });
        }

        await renderAllTasks();
      }

      const updateRequest = objectStore.put(task);
      updateRequest.addEventListener("success", () => {});
    });
  }
}

export function undoLatestTaskEvent() {
  const event = undoStack.pop();
  if (!event) {
    logMessage("log", "Nothing to undo");
    return;
  }

  switch (event.name) {
    // case "task-created":
    //   removeTask(event, false);
    //   break;
    // case "task-updated":
    //   updateTask(event, false);
    //   break;
    // case "task-deleted":
    //   createTask(event, false);
    //   break;
    // case "task-reordered":
    //   reorderTask(event, false);
    //   break;
    default:
      logMessage("error", "Undo not supported for this event type");
  }
}

export function redoLatestTaskEvent() {
  const event = redoStack.pop();
  if (!event) {
    logMessage("log", "Nothing to redo");
    return;
  }

  switch (event.name) {
    //   case "task-created":
    //     removeTask(event);
    //     break;
    //   case "task-updated":
    //     updateTask(event);
    //     break;
    //   case "task-deleted":
    //     createTask(event);
    //     break;
    //   case "task-reordered":
    //     reorderTask(event);
    //     break;
    default:
      logMessage("error", "Redo not supported for this event type");
  }
}
