(function () {
  /*========================
    Data & DOM References
  ========================*/

  const taskListContainer = document.getElementById("task-list");

  let tasks = [];
  let db;
  let latestPosition;

  const DB_NAME = "tasks-app-db";
  const DB_VERSION = 1;
  const DB_STORE_NAME = "tasks";

  function renderAllTasks() {
    let maxPositionValue = 0;
    const objectStore = getObjectStore("tasks", "readonly");
    const index = objectStore.index("position");
    const request = index.openCursor();
    request.addEventListener("success", (event) => {
      const cursor = event.target.result;
      if (cursor) {
        maxPositionValue =
          maxPositionValue < cursor.value.position
            ? cursor.value.position
            : maxPositionValue;
        const taskItem = renderTask(cursor.value);
        taskListContainer.appendChild(taskItem);
        cursor.continue();
      } else {
        latestPosition = maxPositionValue;
        console.log("No more entries!");
      }
    });
  }

  function getObjectStore(store_name, mode) {
    const transaction = db.transaction(store_name, mode);
    return transaction.objectStore(store_name);
  }

  function openDBConnection() {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.addEventListener("upgradeneeded", (event) => {
      db = event.target.result; // Assign db

      db.addEventListener("error", (event) => {
        console.error(`Database error: ${event.target.error?.message}`);
      });

      const objectStore = db.createObjectStore(DB_STORE_NAME, {
        keyPath: "id",
      });

      objectStore.createIndex("id", "id", { unique: true });
      objectStore.createIndex("display", "display", { unique: false });
      objectStore.createIndex("position", "position", { unique: false });
    });

    request.addEventListener("success", (event) => {
      db = event.target.result;
      console.log("Database connection established successfully!");

      renderAllTasks();
    });

    request.addEventListener("error", (event) => {
      console.error(
        "Application not allowed to use IndexedDB for storage, please allow it."
      );
    });
  }

  /*========================
    Drag & Drop Handlers
  ========================*/
  let draggedTaskId = null;

  function dragstartHandler(event) {
    const taskItem = event.target.closest(".task-item");
    if (!taskItem) return;
    draggedTaskId = taskItem.id;
    event.dataTransfer.setData("text/plain", draggedTaskId);
    taskItem.classList.add("dragging");
  }

  function dragoverHandler(event) {
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

  function dropHandler(event) {
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
    const taskLists = [...taskListContainer.children];
    let counter = 1;
    for (const taskItem of taskLists) {
      const [, taskId] = taskItem.id.split("task-item-");
      const request = objectStore.get(taskId);
      request.addEventListener("success", (event) => {
        const task = event.target.result;
        task.position = counter++;

        const updateRequest = objectStore.put(task);
        updateRequest.addEventListener("success", (updateEvent) => {
          console.log("success");
        });
      });
    }
  }

  /*========================
    Rendering Functions
  ========================*/
  function renderTask(task, isDraggable = true) {
    const taskItem = document.createElement("div");
    taskItem.className = "task-item";
    taskItem.id = `task-item-${task.id}`;
    taskItem.innerHTML = `
      <div class="task-meta">
        <div class="task-drag-container">
            <div class="task-drag" id="task-${task.id}-drag"></div>
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
    if (isDraggable) {
      dragHandle.draggable = true;
      dragHandle.addEventListener("dragstart", dragstartHandler);
    } else {
      const taskMeta = taskItem.querySelector(`.task-meta`);
      taskMeta.removeChild(dragHandle);
    }
    return taskItem;
  }

  /*========================
    Helper Functions
  ========================*/
  function getPriorityName(priorityValue) {
    const priorities = { 1: "high", 2: "medium", 3: "low" };
    return priorities[priorityValue] || "low";
  }

  // function formatDate(dateString) {
  //   if (!dateString) return "No due date";
  //   const date = new Date(dateString);
  //   return date.toLocaleDateString("en-US", {
  //     year: "numeric",
  //     month: "short",
  //     day: "numeric",
  //   });
  // }

  const formatDateTime = (dateString) =>
    new Date(dateString).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  /*========================
    Task Operations
  ========================*/
  function toggleTaskCompletion(taskId, isChecked) {
    const newStatus = isChecked ? "completed" : "pending";
    tasks = tasks.map((task) =>
      task.id === taskId
        ? { ...task, status: newStatus, updatedAt: new Date().toISOString() }
        : task
    );
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

  function deleteTask(taskId) {
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

  function viewTask(taskId) {
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

  function editTask(taskId) {
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
  function showCreateTaskModal() {
    const dueDateInput = document.getElementById("task-create-due-date");
    const now = new Date();
    dueDateInput.min = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    document.getElementById("task-create-dialog").showModal();
  }

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
        console.log("New task added successfully!!");
        taskListContainer.appendChild(renderTask(newTask));
        event.target.reset();
        document.getElementById("task-create-dialog").close();
      });
    });

  document.getElementById("task-delete-form").addEventListener("submit", () => {
    const taskId = document.getElementById("task-delete-dialog").dataset.taskId;
    // tasks = tasks.filter((task) => task.id !== taskId);
    // localStorage.setItem("tasks", JSON.stringify(tasks));

    const objectStore = getObjectStore("tasks", "readwrite");
    const request = objectStore.delete(taskId);
    request.addEventListener("success", (event) => {
      console.log(`Task deleted.`);
    });

    document.getElementById(`task-item-${taskId}`)?.remove();
    document.getElementById("task-delete-dialog").close();
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
        const task = event.target.result;

        task.display = formData.get("display");
        task.description = formData.get("description");
        task["due-date"] = formData.get("due-date");
        task.priority = parseInt(formData.get("priority"), 10);
        task.updatedAt = new Date().toISOString();

        const requestUpdate = objectStore.put(task);
        requestUpdate.addEventListener("success", (event) => {
          const taskItem = document.getElementById(`task-item-${taskId}`);
          if (taskItem) {
            taskListContainer.replaceChild(renderTask(task), taskItem);
          }
          document.getElementById("task-edit-dialog").close();
        });
      });
    });

  /*========================
    Event Delegation for Task Actions
  ========================*/
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
    Filter, Sort & Search
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
          taskListContainer.appendChild(taskItem, false);
        }
        cursor.continue();
      }
    });
  });

  document.getElementById("sort-by").addEventListener("change", (event) => {
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
        const sortBy = event.target.value;
        if (sortBy === "due_date") {
          tasksToBeSorted.sort(
            (a, b) => new Date(a["due-date"]) - new Date(b["due-date"])
          );
        } else if (sortBy === "priority") {
          tasksToBeSorted.sort((a, b) => a.priority - b.priority);
        }

        taskListContainer.innerHTML = "";

        tasksToBeSorted.forEach((task) =>
          taskListContainer.appendChild(renderTask(task, false))
        );
      }
    });
  });

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
            taskListContainer.appendChild(taskItem);
          }
          cursor.continue();
        }
      });
    });

  function clearFilters() {
    document.getElementById("task-filter").value = "";
    document.getElementById("sort-by").value = "";
    document.querySelector("#task-search input").value = "";

    taskListContainer.innerHTML = "";

    renderAllTasks();
  }

  document
    .getElementById("clear-search-btn")
    .addEventListener("click", clearFilters);

  /*========================
    Key Bindings
  ========================*/
  document.addEventListener("keydown", (event) => {
    if (event.altKey && event.key.toLocaleLowerCase() === "n") {
      showCreateTaskModal();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.altKey && event.key.toLocaleLowerCase() === "r") {
      clearFilters();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.altKey && event.key.toLocaleLowerCase() === "s") {
      document.querySelector("#task-search input").focus();
    }
  });

  const datePickerStyle = document.createElement("style");
  document.head.appendChild(datePickerStyle);

  function updateDatePickerTheme() {
    const isDarkTheme =
      document.documentElement.getAttribute("data-theme") === "dark";

    if (isDarkTheme) {
      datePickerStyle.textContent = `
            .task-due-date::-webkit-calendar-picker-indicator {
                filter: invert(1);
                cursor: pointer;
                opacity: 0.9;
            }
            
            .task-due-date::-webkit-calendar-picker-indicator:hover {
                opacity: 1;
            }
        `;
    } else {
      datePickerStyle.textContent = `
            .task-due-date::-webkit-calendar-picker-indicator {
                cursor: pointer;
                opacity: 0.9;
            }
            
            .task-due-date::-webkit-calendar-picker-indicator:hover {
                opacity: 1;
            }
        `; // Reset to default in light theme
    }
  }

  /*========================
    Theme Toggling
  ========================*/
  const toggleButton = document.getElementById("theme-toggle");
  toggleButton.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    const themeBtn = document.querySelector("#theme-toggle button");
    themeBtn.innerHTML =
      newTheme === "dark"
        ? `<i class="fa-solid fa-sun fa-xl"></i>`
        : `<i class="fa-solid fa-moon fa-xl"></i>`;
    updateDatePickerTheme();
  });

  /*========================
    Initial Render & Setup
  ========================*/
  window.addEventListener("load", () => {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);

    const themeToggle = document.getElementById("theme-toggle");
    const themeBtn = document.createElement("button");
    themeBtn.innerHTML =
      savedTheme === "dark"
        ? `<i class="fa-solid fa-sun fa-xl"></i>`
        : `<i class="fa-solid fa-moon fa-xl"></i>`;
    themeToggle.appendChild(themeBtn);

    updateDatePickerTheme();

    taskListContainer.innerHTML = "";

    openDBConnection();
  });

  /*========================
    Attach Drag & Drop Listeners
  ========================*/
  taskListContainer.addEventListener("dragover", dragoverHandler);
  taskListContainer.addEventListener("drop", dropHandler);
})();
