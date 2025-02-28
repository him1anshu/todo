import { dragstartHandler } from "./drag-drop";

export function getPriorityName(priorityValue) {
  const priorities = { 1: "high", 2: "medium", 3: "low" };
  return priorities[priorityValue] || "low";
}

export const formatDateTime = (dateString) =>
  new Date(dateString).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

export function renderTask(task, isDraggable = true) {
  const taskItem = document.createElement("div");
  taskItem.className = "task-item";
  taskItem.id = `task-item-${task.id}`;
  taskItem.innerHTML = `
      <div class="task-meta">
        <div class="task-drag-container" id="task-${task.id}-drag">
            <div class="task-drag"></div>
        </div>
        <input type="checkbox" class="status-toggle" 
               id="task-${task.id}-checkbox" ${
    task.status === "completed" ? "checked" : ""
  }
               data-task-id="${task.id}" data-action="checkbox" />
        <div class="priority-indicator priority-${getPriorityName(
          task.priority
        )}"></div>
      </div>
      <div class="task-content">
        <h3 class="task-title" id="task-${task.id}-text">${task.display}</h3>
        <div class="task-details">
          <span class="due-date">
            <i class="fa-regular fa-calendar"></i> ${formatDateTime(
              task["due-date"]
            )}
          </span>
          <span class="status-badge status-${task.status}">${task.status}</span>
        </div>
      </div>
      <div class="task-actions">
        <button class="view-btn" data-action="view" data-task-id="${
          task.id
        }" aria-label="View details">
          <i class="fa-regular fa-eye"></i>
        </button>
        <button class="edit-btn" data-action="edit" data-task-id="${task.id}" 
                ${
                  task.status === "completed" ? "disabled" : ""
                } aria-label="Edit task">
          <i class="fa-regular fa-pen-to-square"></i>
        </button>
        <button class="delete-btn" data-action="delete" data-task-id="${
          task.id
        }" aria-label="Delete task">
          <i class="fa-regular fa-trash-can"></i>
        </button>
      </div>
    `;

  // Apply completed task styling
  const taskText = taskItem.querySelector(`#task-${task.id}-text`);
  if (task.status === "completed") {
    taskText.style.textDecoration = "line-through";
    taskItem.querySelector(".edit-btn").disabled = true;
  }

  // Find the drag handle and attach the event to it
  const dragHandle = taskItem.querySelector(`#task-${task.id}-drag`);
  if (dragHandle) {
    if (isDraggable) {
      dragHandle.draggable = true;
      dragHandle.addEventListener("dragstart", dragstartHandler);
    } else {
      const taskMeta = taskItem.querySelector(`.task-meta`);
      taskMeta.removeChild(dragHandle);
    }
  }
  return taskItem;
}
