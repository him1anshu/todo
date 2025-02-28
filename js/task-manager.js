import { getObjectStore, getAllTasksByIndex } from "./db.js";
import { renderTask, formatDateTime } from "./ui.js";
import { updateDatePickerTheme } from "./date-picker-theme.js";
import { dragstartHandler } from "./drag-drop.js";

const taskListContainer = document.getElementById("task-list");

export function attachDragHandlerToTaskItem(id, taskItem, isDraggable = true) {
  const dragHandle = document.getElementById(`task-${id}-drag`);
  if (dragHandle) {
    if (isDraggable) {
      dragHandle.draggable = true;
      dragHandle.addEventListener("dragstart", dragstartHandler);
    } else {
      const taskMeta = taskItem.querySelector(`.task-meta`);
      taskMeta.removeChild(dragHandle);
    }
  }
}

export async function renderAllTasks() {
  try {
    let maxPositionValue = 0;
    const tasks = await getAllTasksByIndex("tasks", "readonly", "position");
    tasks.forEach((task) => {
      maxPositionValue =
        maxPositionValue < task.position ? task.position : maxPositionValue;
      const taskItem = renderTask(task);
      attachDragHandlerToTaskItem(task.id, taskItem);
      taskListContainer.appendChild(taskItem);
    });

    return maxPositionValue;
  } catch (error) {
    throw error;
  }
}

export async function clearFilters() {
  try {
    document.getElementById("task-filter").value = "";
    document.getElementById("sort-by").value = "";
    document.querySelector("#task-search input").value = "";

    taskListContainer.innerHTML = "";

    await renderAllTasks();
  } catch (error) {
    console.log(error);
  }
}

export function sortTasks(sortBy) {
  const isTaskFilterApplied = document.getElementById("task-filter").value;
  const tasksToBeSorted = [];

  const objectStore = getObjectStore("tasks", "readonly");
  const request = objectStore.openCursor();
  request.addEventListener("success", (idbEvent) => {
    const cursor = idbEvent.target.result;
    if (cursor) {
      const task = cursor.value;
      if (isTaskFilterApplied) {
        if (task.status === isTaskFilterApplied) {
          tasksToBeSorted.push(task);
        }
      } else {
        tasksToBeSorted.push(task);
      }
      cursor.continue();
    } else {
      if (sortBy === "due_date") {
        tasksToBeSorted.sort(
          (a, b) => new Date(a["due-date"]) - new Date(b["due-date"])
        );
      } else if (sortBy === "priority") {
        tasksToBeSorted.sort((a, b) => a.priority - b.priority);
      }

      taskListContainer.innerHTML = "";

      tasksToBeSorted.forEach((task) => {
        const taskItem = renderTask(task);
        attachDragHandlerToTaskItem(task.id, taskItem, false);
        taskListContainer.appendChild(taskItem);
      });
    }
  });
}

export function toggleTaskCompletion(taskId, isChecked) {
  const newStatus = isChecked ? "completed" : "pending";
  // tasks = tasks.map((task) =>
  //   task.id === taskId
  //     ? { ...task, status: newStatus, updatedAt: new Date().toISOString() }
  //     : task
  // );
  // localStorage.setItem("tasks", JSON.stringify(tasks));
  const objectStore = getObjectStore("tasks", "readwrite");
  const request = objectStore.get(taskId);
  request.addEventListener("success", (event) => {
    const task = event.target.result;
    task.status = newStatus;

    const requestUpdate = objectStore.put(task);
    requestUpdate.addEventListener("success", (event) => {
      console.log(`Task updated with status: ${newStatus}.`);
    });
  });

  const taskItem = document.getElementById(`task-item-${taskId}`);
  const currentFilter = document.getElementById("task-filter").value;
  if (currentFilter && currentFilter !== newStatus) {
    taskItem && taskItem.remove();
  } else if (taskItem) {
    const statusBadge = taskItem.querySelector(".status-badge");
    const taskText = taskItem.querySelector(".task-title");
    const editBtn = taskItem.querySelector(".edit-btn");

    taskText.style.textDecoration = isChecked ? "line-through" : "none";
    statusBadge.className = `status-badge status-${newStatus}`;
    statusBadge.textContent = newStatus;
    editBtn.disabled = isChecked;
  }
}

export function deleteTask(taskId) {
  const objectStore = getObjectStore("tasks", "readwrite");
  const request = objectStore.get(taskId);
  request.addEventListener("success", (event) => {
    const task = event.target.result;
    if (!task) return;

    const taskDeleteDialog = document.getElementById("task-delete-dialog");
    document.getElementById("task-delete-display").value = task.display;
    taskDeleteDialog.dataset.taskId = taskId;
    taskDeleteDialog.showModal();
  });
}

export function viewTask(taskId) {
  const objectStore = getObjectStore("tasks", "readwrite");
  const request = objectStore.get(taskId);
  request.addEventListener("success", (event) => {
    const task = event.target.result;
    if (!task) return;

    document.getElementById("task-view-display").value = task.display;
    document.getElementById("task-view-description").value = task.description;
    document.getElementById("task-view-due-date").value = task["due-date"];
    document.getElementById("task-view-priority").value = task.priority;
    document.getElementById("task-view-created").value = formatDateTime(
      task.createdAt
    );
    document.getElementById("task-view-updated").value = formatDateTime(
      task.updatedAt
    );
    document.getElementById("task-view-dialog").showModal();
  });
}

export function editTask(taskId) {
  const objectStore = getObjectStore("tasks", "readwrite");
  const request = objectStore.get(taskId);
  request.addEventListener("success", (event) => {
    const task = event.target.result;
    if (!task) return;

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
  });
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
