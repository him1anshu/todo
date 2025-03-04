import { getAllTasksByIndex, getAllTasks, getTask, putTask } from "./db.js";
import { renderTask, formatDateTime } from "./ui.js";
import { dragstartHandler, touchStartHandler } from "./drag-drop.js";
import {
  updateDatePickerTheme,
  logMessage,
  sendNotification,
} from "./utility.js";

const taskListContainer = document.getElementById("task-list");

export function attachDragHandlerToTaskItem(id, taskItem, isDraggable = true) {
  const dragHandle = taskItem.querySelector(`#task-${id}-drag`);
  if (dragHandle) {
    if (isDraggable) {
      dragHandle.draggable = true;
      dragHandle.addEventListener("dragstart", dragstartHandler);
      dragHandle.addEventListener("touchStart", touchStartHandler);
    } else {
      const taskMeta = taskItem.querySelector(`.task-meta`);
      taskMeta.removeChild(dragHandle);
    }
  }
}

export async function renderAllTasks() {
  try {
    let maxPositionValue = 0;

    const fragment = document.createDocumentFragment();
    const tasks = await getAllTasksByIndex("tasks", "readonly", "position");
    tasks.forEach((task) => {
      maxPositionValue =
        maxPositionValue < task.position ? task.position : maxPositionValue;
      const taskItem = renderTask(task);
      attachDragHandlerToTaskItem(task.id, taskItem);
      fragment.appendChild(taskItem);
    });

    taskListContainer.appendChild(fragment);
    return maxPositionValue;
  } catch (error) {
    throw error;
  }
}

export async function filterTasks(status) {
  taskListContainer.innerHTML = "";
  let tasks = await getAllTasksByIndex("tasks", "readonly", "status");

  tasks = tasks.filter((task) => task.status === status);

  const fragment = document.createDocumentFragment();
  tasks.forEach((task) => {
    const taskItem = renderTask(task);
    attachDragHandlerToTaskItem(task.id, taskItem, false);
    fragment.appendChild(taskItem);
  });

  taskListContainer.appendChild(fragment);
}

export async function clearFilters() {
  try {
    document.getElementById("task-filter").value = "";
    document.getElementById("sort-by").value = "";
    document.querySelector("#task-search input").value = "";

    taskListContainer.innerHTML = "";

    await renderAllTasks();
  } catch (error) {
    logMessage("error", "Error: ", error);
  }
}

export async function sortTasks(sortBy) {
  try {
    let tasks = await getAllTasks("tasks", "readonly");
    const taskFilterValue = document.getElementById("task-filter").value;
    if (taskFilterValue) {
      tasks = tasks.filter((task) => task.status === taskFilterValue);
    }

    if (sortBy === "due_date") {
      tasks.sort((a, b) => new Date(a["due-date"]) - new Date(b["due-date"]));
    } else if (sortBy === "priority") {
      tasks.sort((a, b) => a.priority - b.priority);
    }

    taskListContainer.innerHTML = "";
    const fragment = document.createDocumentFragment();
    tasks.forEach((task) => {
      const taskItem = renderTask(task);
      attachDragHandlerToTaskItem(task.id, taskItem, false);
      fragment.appendChild(taskItem);
    });
    taskListContainer.appendChild(fragment);
  } catch (error) {
    logMessage("error", "Error: ", error);
  }
}

export async function toggleTaskCompletion(taskId, isChecked) {
  try {
    const newStatus = isChecked ? "completed" : "pending";

    const task = await getTask("tasks", "readonly", taskId);
    task.status = newStatus;

    await putTask("tasks", "readwrite", task);

    const taskItem = document.getElementById(`task-item-${taskId}`);
    const currentFilter = document.getElementById("task-filter").value;

    if (currentFilter && currentFilter !== newStatus) {
      taskItem && taskItem.remove();
    } else if (taskItem) {
      const statusBadge = taskItem.querySelector(".status-badge");
      const editBtn = taskItem.querySelector(".edit-btn");

      taskItem.classList.toggle("task-completed", isChecked);

      statusBadge.className = `status-badge status-${newStatus}`;
      statusBadge.textContent = newStatus;

      editBtn.disabled = isChecked;
    }
  } catch (error) {
    logMessage("error", "Error: ", error);
  }
}

export async function removeTask(taskId) {
  try {
    const task = await getTask("tasks", "readonly", taskId);
    const taskDeleteDialog = document.getElementById("task-delete-dialog");
    document.getElementById("task-delete-display").value = task.display;
    taskDeleteDialog.dataset.taskId = taskId;
    taskDeleteDialog.showModal();
  } catch (error) {
    logMessage("error", "Error: ", error);
  }
}

export async function viewTask(taskId) {
  try {
    const task = await getTask("tasks", "readonly", taskId);

    document.getElementById("task-view-display").value = task.display;
    document.getElementById("task-view-description").value = task.description;
    document.getElementById("task-view-due-date").value = task["due-date"];
    document.getElementById("task-view-priority").value = task.priority;
    document.getElementById("task-view-created").value = formatDateTime(
      task.createdAt
    );
    // document.getElementById("task-view-updated").value = formatDateTime(
    //   task.updatedAt
    // );
    document.getElementById("task-view-dialog").showModal();
  } catch (error) {
    logMessage("error", "Error: ", error);
  }
}

export async function editTask(taskId) {
  try {
    const task = await getTask("tasks", "readonly", taskId);

    const editForm = document.getElementById("task-edit-form");
    editForm.elements["display"].value = task.display;
    editForm.elements["description"].value = task.description;
    editForm.elements["due-date"].value = task["due-date"];
    editForm.elements["priority"].value = task.priority;
    const now = new Date();
    editForm.elements["due-date"].min = new Date(
      now.getTime() - now.getTimezoneOffset() * 60000
    )
      .toISOString()
      .slice(0, 16);
    editForm.dataset.taskId = taskId;
    document.getElementById("task-edit-dialog").showModal();
  } catch (error) {
    logMessage("error", "Error: ", error);
  }
}

/*========================
    Modal & Form Event Handlers
  ========================*/
export function showCreateTaskModal() {
  const dueDateInput = document.getElementById("task-create-due-date");
  const now = new Date();
  dueDateInput.min = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
  document.getElementById("task-create-dialog").showModal();
}

export function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", newTheme);

  localStorage.setItem("theme", newTheme);
  updateToggleBtn(newTheme);
}

export function updateToggleBtn(theme) {
  const themeBtn = document.querySelector("#theme-toggle button");
  themeBtn.innerHTML =
    theme === "dark"
      ? `<i class="fa-solid fa-sun fa-xl"></i>`
      : `<i class="fa-solid fa-moon fa-xl"></i>`;

  updateDatePickerTheme();
}

export async function taskCreateHandler(event) {
  const { taskId, task } = event.detail;

  const fragment = document.createDocumentFragment();
  const taskFilter = document.querySelector("#task-filter");
  const sortBy = document.querySelector("#sort-by");

  if (taskFilter.value !== "completed") {
    if (sortBy.value) {
      await sortTasks(sortBy.value);
    } else {
      const taskItem = renderTask(task);
      attachDragHandlerToTaskItem(taskId, taskItem);
      fragment.appendChild(taskItem);
    }
  }

  taskListContainer.appendChild(fragment);
}

export function taskUpdateHandler(event) {
  const { taskId, task } = event.detail;

  const taskItem = document.getElementById(`task-item-${taskId}`);
  if (taskItem) {
    const sortBy = document.querySelector("#sort-by");
    let isDraggable = true;
    if (sortBy.value) {
      isDraggable = false;
    }

    const newTaskItem = renderTask(task);
    attachDragHandlerToTaskItem(taskId, newTaskItem, isDraggable);
    taskListContainer.replaceChild(newTaskItem, taskItem);
  }
}

export function taskDeleteHandler(event) {
  const { taskId } = event.detail;

  document.getElementById(`task-item-${taskId}`)?.remove();
}

export async function checkDueTasks(swTriggered = false) {
  console.log("Checking due date");
  const currTime = new Date().getTime();
  const tasks = await getAllTasksByIndex("tasks", "readonly", "position");
  const updateTasks = [];

  tasks.forEach((task) => {
    const dueTime = new Date(task["due-date"]).getTime();
    const timeDiff = dueTime - currTime;

    if (timeDiff <= 0 && !task["overdue-notification-sent"]) {
      if (swTriggered) {
        navigator.serviceWorker.controller?.postMessage({
          action: "sendNotification",
          title: task.display,
          message: "Task is overdue!!",
        });
      } else {
        sendNotification(task.display, `Task is overdue!!`);
      }
      task["overdue-notification-sent"] = true;
      updateTasks.push(putTask("tasks", "readwrite", task));
    } else if (timeDiff <= 3600000 && !task["due-notification-sent"]) {
      if (swTriggered) {
        navigator.serviceWorker.controller?.postMessage({
          action: "sendNotification",
          title: task.display,
          message: "Due date for task is approaching!!",
        });
      } else {
        sendNotification(task.display, `Due date for task is approaching!!`);
      }

      task["due-notification-sent"] = true;
      updateTasks.push(putTask("tasks", "readwrite", task));
    }
  });

  await Promise.all(updateTasks);
}
