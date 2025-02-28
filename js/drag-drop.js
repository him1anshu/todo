import { getObjectStore } from "./db.js";
import { pushDataToStack } from "./undo-redo.js";

let draggedTaskId = null;

export function dragstartHandler(event) {
  const taskItem = event.target.closest(".task-item");
  if (!taskItem) return;
  draggedTaskId = taskItem.id;
  event.dataTransfer.setData("text/plain", draggedTaskId);
  taskItem.classList.add("dragging");
}

export function dragoverHandler(event) {
  event.preventDefault(); // Allow drop
  const targetTask = event.target.closest(".task-item");
  if (!targetTask || targetTask.id === draggedTaskId) return;

  const bounding = targetTask.getBoundingClientRect();
  const offset = event.clientY - bounding.top;
  const middle = bounding.height / 2;

  if (offset > middle) {
    targetTask.parentNode.insertBefore(
      document.getElementById(draggedTaskId),
      targetTask.nextSibling
    );
  } else {
    targetTask.parentNode.insertBefore(
      document.getElementById(draggedTaskId),
      targetTask
    );
  }
}

export function dropHandler(event) {
  event.preventDefault();
  const draggedElement = document.getElementById(draggedTaskId);
  if (draggedElement) {
    draggedElement.classList.remove("dragging");
  }
  draggedTaskId = null;
  updateTaskOrder();
}

function updateTaskOrder() {
  const objectStore = getObjectStore("tasks", "readwrite");

  let counter = 1;
  const taskReorderedData = [];
  const tasksList = [...taskListContainer.children];
  for (const taskItem of tasksList) {
    const [, taskId] = taskItem.id.split("task-item-");

    const request = objectStore.get(taskId);
    request.addEventListener("success", (event) => {
      const task = { ...event.target.result };
      task.position = counter++;

      taskReorderedData.push({
        taskId: task.id,
        prevPos: event.target.result.position,
        newPos: task.position,
      });

      if (tasksList.length === counter - 1) {
        pushDataToStack({
          name: "task-reordered",
          data: taskReorderedData,
        });
      }

      const updateRequest = objectStore.put(task);
      updateRequest.addEventListener("success", () => {});
    });
  }
}
