import { openDBConnection, getObjectStore } from "./db.js";
import { registerServiceWorker } from "./serviceWorkerRegistration.js";
import { dragoverHandler, dropHandler } from "./drag-drop.js";
import {
  attachDragHandlerToTaskItem,
  renderAllTasks,
  clearFilters,
  sortTasks,
  toggleTaskCompletion,
  deleteTask,
  viewTask,
  editTask,
  showCreateTaskModal,
  toggleTheme,
  updateToggleBtn,
} from "./task-manager.js";
import {
  pushDataToStack,
  undoLatestTaskEvent,
  redoLatestTaskEvent,
} from "./undo-redo.js";
import { renderTask } from "./ui.js";

(function () {
  let db;
  let tasks = [];
  let latestPosition;

  const taskListContainer = document.getElementById("task-list");
  taskListContainer.addEventListener("dragover", dragoverHandler);
  taskListContainer.addEventListener("drop", dropHandler);

  registerServiceWorker();

  /*========================
    Taks Action
  ========================*/

  document.getElementById("task-filter").addEventListener("change", (event) => {
    const status = event.target.value;
    taskListContainer.innerHTML = "";

    const objectStore = getObjectStore("tasks", "readonly");
    const request = objectStore.openCursor();
    request.addEventListener("success", (idbEvent) => {
      const cursor = idbEvent.target.result;
      if (cursor) {
        const task = cursor.value;
        if (task.status === status) {
          const taskItem = renderTask(task);
          attachDragHandlerToTaskItem(task.id, taskItem, false);
          taskListContainer.appendChild(taskItem);
        }
        cursor.continue();
      }
    });
  });

  document
    .getElementById("sort-by")
    .addEventListener("change", (event) => sortTasks(event.target.value));

  document
    .querySelector("#task-search input")
    .addEventListener("input", (event) => {
      const searchTerm = event.target.value.toLowerCase();
      taskListContainer.innerHTML = "";

      const objectStore = getObjectStore("tasks", "readonly");
      const request = objectStore.openCursor();
      request.addEventListener("success", (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const task = cursor.value;
          if (task.display.toLowerCase().includes(searchTerm)) {
            const taskItem = renderTask(cursor.value);
            attachDragHandlerToTaskItem(task.id, taskItem, false);
            taskListContainer.appendChild(taskItem);
          }
          cursor.continue();
        }
      });
    });

  document
    .getElementById("clear-search-btn")
    .addEventListener("click", async () => {
      await clearFilters();
    });

  taskListContainer.addEventListener("click", (event) => {
    const target = event.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    const taskId = target.dataset.taskId;
    switch (action) {
      case "checkbox":
        toggleTaskCompletion(taskId, target.checked);
        break;
      case "delete":
        deleteTask(taskId);
        break;
      case "view":
        viewTask(taskId);
        break;
      case "edit":
        editTask(taskId);
        break;
    }
  });

  /*========================
    Modal & Form Event Handlers
  ========================*/
  document
    .getElementById("task-add-btn")
    .addEventListener("click", showCreateTaskModal);

  document
    .getElementById("task-create-cancel")
    .addEventListener("click", () => {
      document.getElementById("task-create-dialog").close();
    });

  document
    .getElementById("task-create-form")
    .addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);
      const newTask = {
        id: Date.now().toString(),
        position: ++latestPosition,
        display: formData.get("display"),
        description: formData.get("description"),
        "due-date": formData.get("due-date"),
        priority: parseInt(formData.get("priority"), 10),
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const objectStore = getObjectStore("tasks", "readwrite");
      const request = objectStore.add(newTask);
      request.addEventListener("success", (dbEvent) => {
        const taskFilter = document.querySelector("#task-filter");
        const sortBy = document.querySelector("#sort-by");
        if (taskFilter.value !== "completed") {
          if (sortBy.value) {
            sortTasks(sortBy.value);
          } else {
            const taskItem = renderTask(newTask);
            attachDragHandlerToTaskItem(newTask.id, taskItem);
            taskListContainer.appendChild(taskItem);
          }
        }

        event.target.reset();
        document.getElementById("task-create-dialog").close();

        pushDataToStack({
          name: "task-created",
          taskId: newTask.id,
          data: newTask,
        });
      });
    });

  document.getElementById("task-delete-form").addEventListener("submit", () => {
    const taskId = document.getElementById("task-delete-dialog").dataset.taskId;

    const objectStore = getObjectStore("tasks", "readwrite");
    const getRequest = objectStore.get(taskId);
    getRequest.addEventListener("success", (event) => {
      const task = event.target.result;

      const request = objectStore.delete(taskId);
      request.addEventListener("success", () => {
        pushDataToStack({
          name: "task-deleted",
          taskId,
          data: task,
        });
        document.getElementById(`task-item-${taskId}`)?.remove();
        document.getElementById("task-delete-dialog").close();
      });
    });
  });

  document.getElementById("task-edit-cancel")?.addEventListener("click", () => {
    document.getElementById("task-edit-dialog").close();
  });
  document
    .getElementById("task-delete-cancel")
    ?.addEventListener("click", () => {
      document.getElementById("task-delete-dialog").close();
    });

  document
    .getElementById("task-edit-form")
    .addEventListener("submit", (event) => {
      event.preventDefault();
      const taskId = event.target.dataset.taskId;
      const formData = new FormData(event.target);

      const objectStore = getObjectStore("tasks", "readwrite");
      const request = objectStore.get(taskId);
      request.addEventListener("success", (event) => {
        const task = { ...event.target.result };

        task.display = formData.get("display");
        task.description = formData.get("description");
        task["due-date"] = formData.get("due-date");
        task.priority = parseInt(formData.get("priority"), 10);
        task.updatedAt = new Date().toISOString();

        const requestUpdate = objectStore.put(task);
        requestUpdate.addEventListener("success", (updateEvent) => {
          const taskItem = document.getElementById(`task-item-${taskId}`);
          if (taskItem) {
            const sortBy = document.querySelector("#sort-by");
            let isDraggable = true;
            if (sortBy.value) {
              isDraggable = false;
            }

            const newTaskItem = renderTask(task);
            attachDragHandlerToTaskItem(task.id, newTaskItem, isDraggable);
            taskListContainer.replaceChild(newTaskItem, taskItem);
          }
          document.getElementById("task-edit-dialog").close();

          pushDataToStack({
            name: "task-updated",
            taskId: task.id,
            prevData: event.target.result,
            newData: task,
          });
        });
      });
    });

  // Initial Render & Setup
  window.addEventListener("load", async () => {
    const datePickerStyle = document.createElement("style");
    document.head.appendChild(datePickerStyle);

    const theme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", theme);

    const themeToggle = document.getElementById("theme-toggle");
    const themeBtn = document.createElement("button");
    themeToggle.appendChild(themeBtn);
    updateToggleBtn(theme);

    taskListContainer.innerHTML = "";

    try {
      db = await openDBConnection();
      console.log("Database connection established!");
      latestPosition = await renderAllTasks();
    } catch (error) {
      console.error("Error opening database:", error);
    }
  });

  // Theme Toggling
  const toggleButton = document.getElementById("theme-toggle");
  toggleButton.addEventListener("click", toggleTheme);

  // Register key bindings
  document.addEventListener("keydown", (event) => {
    if (event.altKey && event.key.toLocaleLowerCase() === "n") {
      showCreateTaskModal();
    }
  });

  document.addEventListener("keydown", async (event) => {
    if (event.altKey && event.key.toLocaleLowerCase() === "r") {
      await clearFilters();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.altKey && event.key.toLocaleLowerCase() === "s") {
      document.querySelector("#task-search input").focus();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key.toLocaleLowerCase() === "z") {
      undoLatestTaskEvent();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key.toLocaleLowerCase() === "y") {
      redoLatestTaskEvent();
    }
  });
})();
