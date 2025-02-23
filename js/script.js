let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

const taskListContainer = document.getElementById("task-list");

let draggedTaskId = null;

function dragstartHandler(event) {
  draggedTaskId = event.target.id; // Store the dragged task ID
  event.dataTransfer.setData("text/plain", draggedTaskId);
  event.target.classList.add("dragging");
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
  event.target.classList.remove("dragging");
  draggedTaskId = null;
  updateTaskOrder();
}

function updateTaskOrder() {
  const taskElements = [...taskListContainer.children];
  tasks = taskElements.map((taskEl) => {
    return tasks.find((task) => `task-item-${task.id}` === taskEl.id);
  });

  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function renderTask(task, isDraggable = true) {
  const taskItem = document.createElement("div");
  taskItem.className = "task-item";
  taskItem.id = `task-item-${task.id}`;
  taskItem.innerHTML = `
    <div class="task-meta">
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
          <i class="fa-regular fa-calendar"></i> ${formatDate(task["due-date"])}
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

  taskItem.draggable = isDraggable;

  taskItem.addEventListener("dragstart", dragstartHandler);

  return taskItem;
}

// Helper functions
function getPriorityName(priorityValue) {
  const priorities = { 1: "high", 2: "medium", 3: "low" };
  return priorities[priorityValue] || "low";
}

function formatDate(dateString) {
  if (!dateString) return "No due date";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Initial render
window.addEventListener("load", () => {
  taskListContainer.innerHTML = "";
  tasks.forEach((task) => {
    taskListContainer.appendChild(renderTask(task));
  });
});

taskListContainer.addEventListener("dragover", dragoverHandler);
taskListContainer.addEventListener("drop", dropHandler);

// Event delegation for task actions
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

// Create Task Dialog
const taskCreateDialog = document.getElementById("task-create-dialog");
function showCreateTaskModal() {
  const dueDateInput = document.getElementById("task-create-due-date");
  const now = new Date();
  dueDateInput.min = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
  taskCreateDialog.showModal();
}

document
  .getElementById("task-add-btn")
  .addEventListener("click", showCreateTaskModal);
document.getElementById("task-create-cancel").addEventListener("click", () => {
  taskCreateDialog.close();
});
document
  .getElementById("task-create-form")
  .addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const newTask = {
      id: Date.now().toString(),
      display: formData.get("display"),
      description: formData.get("description"),
      "due-date": formData.get("due-date"),
      priority: parseInt(formData.get("priority"), 10),
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    tasks.push(newTask);
    localStorage.setItem("tasks", JSON.stringify(tasks));
    taskListContainer.appendChild(renderTask(newTask));
    event.target.reset();
    taskCreateDialog.close();
  });

// Delete Task
function deleteTask(taskId) {
  const taskDeleteDialog = document.getElementById("task-delete-dialog");
  document.getElementById("task-delete-display").value =
    tasks.find((task) => task.id === taskId)?.display || "";
  taskDeleteDialog.dataset.taskId = taskId;
  taskDeleteDialog.showModal();
}
document.getElementById("task-delete-form").addEventListener("submit", () => {
  const taskId = document.getElementById("task-delete-dialog").dataset.taskId;
  tasks = tasks.filter((task) => task.id !== taskId);
  localStorage.setItem("tasks", JSON.stringify(tasks));
  document.getElementById(`task-item-${taskId}`)?.remove();
  document.getElementById("task-delete-dialog").close();
});
document.getElementById("task-edit-cancel")?.addEventListener("click", () => {
  document.getElementById("task-edit-dialog").close();
});
document.getElementById("task-delete-cancel")?.addEventListener("click", () => {
  document.getElementById("task-delete-dialog").close();
});

// View Task
function viewTask(taskId) {
  const task = tasks.find((task) => task.id === taskId);
  if (!task) return;
  const formatDateTime = (dateString) =>
    new Date(dateString).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
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
}

// Edit Task
function editTask(taskId) {
  const task = tasks.find((task) => task.id === taskId);
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
}
document
  .getElementById("task-edit-form")
  .addEventListener("submit", (event) => {
    event.preventDefault();
    const taskId = event.target.dataset.taskId;
    const formData = new FormData(event.target);
    tasks = tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            display: formData.get("display"),
            description: formData.get("description"),
            "due-date": formData.get("due-date"),
            priority: parseInt(formData.get("priority"), 10),
            updatedAt: new Date().toISOString(),
          }
        : task
    );
    localStorage.setItem("tasks", JSON.stringify(tasks));
    const taskItem = document.getElementById(`task-item-${taskId}`);
    if (taskItem) {
      const newTask = tasks.find((t) => t.id === taskId);
      taskListContainer.replaceChild(renderTask(newTask), taskItem);
    }
    document.getElementById("task-edit-dialog").close();
  });

// Toggle Task Completion
function toggleTaskCompletion(taskId, isChecked) {
  // Update the task's status in the tasks array
  const newStatus = isChecked ? "completed" : "pending";
  tasks = tasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        }
      : task
  );

  localStorage.setItem("tasks", JSON.stringify(tasks));

  const taskItem = document.getElementById(`task-item-${taskId}`);
  // Get current filter selection
  const currentFilter = document.getElementById("task-filter").value;

  // If a filter is active and the task's new status doesn't match, remove it from the DOM
  if (currentFilter && currentFilter !== newStatus) {
    taskItem && taskItem.remove();
  } else if (taskItem) {
    // Otherwise, update the task item in the DOM
    const statusBadge = taskItem.querySelector(".status-badge");
    const taskText = taskItem.querySelector(".task-title");
    const editBtn = taskItem.querySelector(".edit-btn");

    taskText.style.textDecoration = isChecked ? "line-through" : "none";
    statusBadge.className = `status-badge status-${newStatus}`;
    statusBadge.textContent = newStatus;
    editBtn.disabled = isChecked;
  }
}

// Filter functionality
document.getElementById("task-filter").addEventListener("change", (event) => {
  const status = event.target.value;
  const filteredTasks = status
    ? tasks.filter((task) => task.status === status)
    : tasks;
  taskListContainer.innerHTML = "";
  filteredTasks.forEach((task) =>
    taskListContainer.appendChild(renderTask(task, false))
  );
});

// Sort functionality for "Sort by" select
document.getElementById("sort-by").addEventListener("change", (event) => {
  let sortedTasks = null;
  const taskStatus = document.getElementById("task-filter").value;
  if (taskStatus) {
    sortedTasks = tasks.filter((task) => {
      return task.status === taskStatus;
    });
  } else {
    sortedTasks = [...tasks];
  }

  const sortBy = event.target.value;
  if (sortBy === "due_date") {
    sortedTasks.sort(
      (a, b) => new Date(a["due-date"]) - new Date(b["due-date"])
    );
  } else if (sortBy === "priority") {
    sortedTasks.sort((a, b) => a.priority - b.priority);
  }
  taskListContainer.innerHTML = "";
  sortedTasks.forEach((task) =>
    taskListContainer.appendChild(renderTask(task, false))
  );
});

// Search functionality
document
  .querySelector("#task-search input")
  .addEventListener("input", (event) => {
    const searchTerm = event.target.value.toLowerCase();
    const filteredTasks = tasks.filter(
      (task) =>
        task.display.toLowerCase().includes(searchTerm) ||
        (task.description &&
          task.description.toLowerCase().includes(searchTerm))
    );
    taskListContainer.innerHTML = "";
    filteredTasks.forEach((task) =>
      taskListContainer.appendChild(renderTask(task))
    );
  });

// Clear filter functionality
function clearFilters() {
  document.getElementById("task-filter").value = "";
  document.getElementById("sort-by").value = "";
  document.querySelector("#task-search input").value = "";
  taskListContainer.innerHTML = "";
  tasks.forEach((task) => taskListContainer.appendChild(renderTask(task)));
}

document
  .getElementById("clear-search-btn")
  .addEventListener("click", clearFilters);

/* (ALT + N) Key binding to create new task */
document.addEventListener("keydown", (event) => {
  if (event.altKey && event.key.toLocaleLowerCase() === "n") {
    showCreateTaskModal();
  }
});

/* (ALT + R) Key binding to clear all filters */
document.addEventListener("keydown", (event) => {
  if (event.altKey && event.key.toLocaleLowerCase() === "r") {
    clearFilters();
  }
});

/* (ALT + S) Key binding to search tasks */
document.addEventListener("keydown", (event) => {
  if (event.altKey && event.key.toLocaleLowerCase() === "s") {
    document.querySelector("#task-search input").focus();
  }
});
