import { openDBConnection, getAllTasks, getTask } from "./db.js";
import { registerServiceWorker } from "./serviceWorkerRegistration.js";
import { dragoverHandler, dropHandler } from "./drag-drop.js";
import {
  attachDragHandlerToTaskItem,
  renderAllTasks,
  filterTasks,
  clearFilters,
  sortTasks,
  toggleTaskCompletion,
  removeTask,
  viewTask,
  editTask,
  showCreateTaskModal,
  toggleTheme,
  updateToggleBtn,
  taskCreateHandler,
  taskUpdateHandler,
  taskDeleteHandler,
} from "./task-manager.js";
import { renderTask } from "./ui.js";
import {
  logMessage,
  handleContextMenu,
  handleClickOutside,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  handleKeyNavigation,
} from "./utility.js";

import { undoRedoManager } from "./undo-redo.js";
import {
  CreateTaskCommand,
  DeleteTaskCommand,
  UpdateTaskCommand,
} from "./commands.js";

(function () {
  let db;
  // let tasks = [];
  let latestPosition;

  const taskListContainer = document.getElementById("task-list");

  registerServiceWorker();

  /*========================
    Taks Action
  ========================*/

  document
    .getElementById("task-filter")
    .addEventListener("change", async (event) => {
      try {
        const status = event.target.value;

        await filterTasks(status);
      } catch (error) {
        logMessage("error", "Error: ", error);
      }
    });

  document
    .getElementById("sort-by")
    .addEventListener(
      "change",
      async (event) => await sortTasks(event.target.value)
    );

  document
    .querySelector("#task-search input")
    .addEventListener("input", async (event) => {
      try {
        const searchTerm = event.target.value.toLowerCase();
        taskListContainer.innerHTML = "";

        const fragment = document.createDocumentFragment();
        const tasks = await getAllTasks("tasks", "readonly");
        tasks.forEach((task) => {
          if (task.display.toLowerCase().includes(searchTerm)) {
            const taskItem = renderTask(task);
            attachDragHandlerToTaskItem(task.id, taskItem, false);
            fragment.appendChild(taskItem);
          }
        });

        taskListContainer.appendChild(fragment);
      } catch (error) {
        logMessage("error", "Error: ", error);
      }
    });

  document
    .getElementById("clear-search-btn")
    .addEventListener("click", async () => {
      await clearFilters();
    });

  taskListContainer.addEventListener("click", async (event) => {
    const target = event.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    const taskId = target.dataset.taskId;
    switch (action) {
      case "checkbox":
        await toggleTaskCompletion(taskId, target.checked);
        break;
      case "delete":
        await removeTask(taskId);
        break;
      case "view":
        await viewTask(taskId);
        break;
      case "edit":
        await editTask(taskId);
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
    .addEventListener("submit", async (event) => {
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

      try {
        await undoRedoManager.execute(new CreateTaskCommand(newTask));

        event.target.reset();
        document.getElementById("task-create-dialog").close();
      } catch (error) {
        logMessage("error", "Error: ", error);
      }
    });

  document
    .getElementById("task-delete-form")
    .addEventListener("submit", async () => {
      try {
        const taskId =
          document.getElementById("task-delete-dialog").dataset.taskId;

        const task = await getTask("tasks", "readonly", taskId);
        await undoRedoManager.execute(new DeleteTaskCommand(task.id, task));

        document.getElementById("task-delete-dialog").close();
      } catch (error) {
        logMessage("error", "Error: ", error);
      }
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
    .addEventListener("submit", async (event) => {
      event.preventDefault();
      const taskId = event.target.dataset.taskId;
      const formData = new FormData(event.target);

      try {
        const task = await getTask("tasks", "readonly", taskId);

        const prevData = { ...task };

        task.display = formData.get("display");
        task.description = formData.get("description");
        task["due-date"] = formData.get("due-date");
        task.priority = parseInt(formData.get("priority"), 10);
        task.updatedAt = new Date().toISOString();

        await undoRedoManager.execute(
          new UpdateTaskCommand(task.id, prevData, task)
        );

        document.getElementById("task-edit-dialog").close();
      } catch (error) {
        logMessage("error", "Error: ", error);
      }
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
      logMessage("log", "Database connection established!");

      latestPosition = await renderAllTasks();
    } catch (error) {
      logMessage("error", "Error opening database:", error);
    }
  });

  // Theme Toggling
  const toggleButton = document.getElementById("theme-toggle");
  toggleButton.addEventListener("click", toggleTheme);

  // Custom event handlers for tasks
  document.addEventListener("task-created", async (event) => {
    await taskCreateHandler(event);
  });
  document.addEventListener("task-updated", (event) => {
    taskUpdateHandler(event);
  });
  document.addEventListener("task-deleted", (event) => {
    taskDeleteHandler(event);
  });

  // Register key bindings
  document.addEventListener("keydown", async (event) => {
    if (event.altKey || event.ctrlKey) {
      const key = event.key.toLowerCase();

      switch (true) {
        case event.altKey && key === "n":
          showCreateTaskModal();
          break;

        case event.altKey && key === "r":
          await clearFilters();
          break;

        case event.altKey && key === "s":
          document.querySelector("#task-search input").focus();
          break;

        case event.ctrlKey && key === "z":
          undoRedoManager.undo();
          break;

        case event.ctrlKey && key === "y":
          undoRedoManager.redo();
          break;
      }
    }
  });

  // Custom context menu
  document.addEventListener("contextmenu", handleContextMenu);
  document.addEventListener("click", handleClickOutside);
  document.addEventListener("keydown", handleKeyNavigation);

  // Drag and Drop Mouse events
  document.addEventListener("dragover", dragoverHandler);
  document.addEventListener("drop", dropHandler);

  document.addEventListener(
    "touchstart",
    handleTouchStart,
    { passive: false } // Ensures preventDefault() works
  );
  document.addEventListener("touchmove", handleTouchMove, { passive: false });
  document.addEventListener("touchend", handleTouchEnd);
})();
