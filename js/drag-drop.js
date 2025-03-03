import { undoRedoManager } from "./undo-redo.js";
import { ReorderTaskCommand } from "./commands.js";

let draggedTaskId = null;

// Mouse Event Handlers
export function dragstartHandler(event) {
  const taskItem = event.target.closest(".task-item");
  if (!taskItem) return;
  draggedTaskId = taskItem.id;
  event.dataTransfer.setData("text/plain", draggedTaskId);
  taskItem.classList.add("dragging");
}

export function dragoverHandler(event) {
  event.preventDefault(); // Allow drop
  handleReorder(event.clientY, event.target);
}

export async function dropHandler(event) {
  event.preventDefault();
  finalizeDrop();
}

// Touch Event Handlers
export function touchStartHandler(event) {
  const taskItem = event.target.closest(".task-item");
  if (!taskItem) return;
  draggedTaskId = taskItem.id;
  taskItem.classList.add("dragging");

  const touch = event.touches[0];
  taskItem.dataset.offsetY =
    touch.clientY - taskItem.getBoundingClientRect().top;
}

let scrollSpeed = 10; // Speed of auto-scrolling

export function touchMoveHandler(event) {
  if (!draggedTaskId) return;

  const touch = event.touches[0];
  const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);

  handleReorder(touch.clientY, targetElement);

  // Enable auto-scrolling when dragging near screen edges
  const buffer = 50; // Pixels from the edge to trigger scrolling
  if (touch.clientY < buffer) {
    // Scroll up
    window.scrollBy({ top: -scrollSpeed, behavior: "smooth" });
  } else if (touch.clientY > window.innerHeight - buffer) {
    // Scroll down
    window.scrollBy({ top: scrollSpeed, behavior: "smooth" });
  }
}

export function touchEndHandler(event) {
  finalizeDrop();
}

function handleReorder(clientY, targetElement) {
  const targetTask = targetElement.closest(".task-item");
  if (!targetTask || targetTask.id === draggedTaskId) return;

  const bounding = targetTask.getBoundingClientRect();
  const offset = clientY - bounding.top;
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

async function finalizeDrop() {
  if (!draggedTaskId) return;

  const draggedElement = document.getElementById(draggedTaskId);
  if (draggedElement) {
    draggedElement.classList.remove("dragging");
  }

  const [, taskId] = draggedTaskId.split("task-item-");
  await undoRedoManager.execute(new ReorderTaskCommand(taskId));

  draggedTaskId = null;
}
