import { getTask } from "./db.js";
let draggedTaskId = null;
const taskListContainer = document.getElementById("task-list");

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

export async function dropHandler(event) {
  event.preventDefault();
  const draggedElement = document.getElementById(draggedTaskId);
  if (draggedElement) {
    draggedElement.classList.remove("dragging");
  }
  draggedTaskId = null;
  await updateTaskOrder();
}

async function updateTaskOrder() {
  let counter = 1;
  const taskReorderedData = [];
  const tasksList = [...taskListContainer.children];

  try {
    for (const taskItem of tasksList) {
      const [, taskId] = taskItem.id.split("task-item-");

      const taskData = await getTask("tasks", "readonly", taskId);

      const task = { ...taskData };
      task.position = counter++;

      taskReorderedData.push({
        taskId: task.id,
        prevPos: taskData.position,
        newPos: task.position,
      });

      if (tasksList.length === counter - 1) {
        pushDataToStack({
          name: "task-reordered",
          data: taskReorderedData,
        });
      }

      await getTask("tasks", "readonly", task);
    }
  } catch (error) {
    console.log(error);
  }
}
