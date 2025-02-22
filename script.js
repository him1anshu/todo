let tasks = null;
if (localStorage.getItem("tasks")) {
  tasks = JSON.parse(localStorage.getItem("tasks"));
} else {
  tasks = [];
}

const taskListContainer = document.getElementById("task-list");

function renderTask(task) {
  const taskItem = document.createElement("div");
  taskItem.className = "task-item";
  taskItem.id = `task-item-${task.id}`;

  // Checkbox
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = `task-${task.id}-checkbox`;
  checkbox.name = "completed";
  checkbox.dataset.action = "checkbox";
  checkbox.dataset.taskId = task.id;

  if (task.status === "completed") {
    checkbox.checked = "checked";
  }
  taskItem.appendChild(checkbox);

  // Task text
  const taskText = document.createElement("p");
  taskText.className = "task-text";
  taskText.id = `task-${task.id}-text`;
  taskText.textContent = task.display;

  if (task.status === "completed") {
    taskText.style.textDecoration = "line-through";
  }
  taskItem.appendChild(taskText);

  // View Button
  const viewBtn = document.createElement("button");
  viewBtn.type = "button";
  viewBtn.className = "view";
  viewBtn.dataset.action = "view";
  viewBtn.dataset.taskId = task.id;
  viewBtn.setAttribute("aria-label", "View Task");
  const viewIcon = document.createElement("i");
  viewIcon.className = "fa-solid fa-eye";
  viewBtn.appendChild(viewIcon);
  taskItem.appendChild(viewBtn);

  // Edit Button
  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "edit";
  editBtn.dataset.action = "edit";
  editBtn.dataset.taskId = task.id;
  editBtn.setAttribute("aria-label", "Edit Task");
  const editIcon = document.createElement("i");
  editIcon.className = "fa-solid fa-pen-to-square";

  if (task.status === "completed") {
    editBtn.disabled = "disabled";
  }
  editBtn.appendChild(editIcon);
  taskItem.appendChild(editBtn);

  // Delete Button
  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "delete";
  deleteBtn.dataset.action = "delete";
  deleteBtn.dataset.taskId = task.id;
  deleteBtn.setAttribute("aria-label", "Delete Task");
  const deleteIcon = document.createElement("i");
  deleteIcon.className = "fa-solid fa-trash";
  deleteBtn.appendChild(deleteIcon);
  taskItem.appendChild(deleteBtn);

  taskListContainer.appendChild(taskItem);
}

window.addEventListener("load", () => {
  tasks.forEach((task) => renderTask(task));
});

taskListContainer.addEventListener("click", (event) => {
  // Check if the click target is a checkbox
  if (event.target.matches('input[type="checkbox"]')) {
    toggleTaskCompletion(event);
    return;
  }

  // Otherwise, check for button clicks
  const targetButton = event.target.closest("button");
  if (!targetButton) return;
  const action = targetButton.dataset.action;
  const taskId = targetButton.dataset.taskId;

  switch (action) {
    case "delete":
      deleteTask(taskId);
      break;
    case "view":
      viewTask(taskId);
      break;
    case "edit":
      editTask(taskId);
      break;
    // Note: "checkbox" case is now handled above
  }
});

// Create Task Dialog and Form
const taskCreateDialog = document.getElementById("task-create-dialog");
const taskAddBtn = document.getElementById("task-add-btn");
const taskCreateCancel = document.getElementById("task-create-cancel");
const taskCreateForm = document.getElementById("task-create-form");

taskAddBtn.addEventListener("click", () => {
  taskCreateDialog.showModal();
});

taskCreateCancel.addEventListener("click", () => {
  taskCreateDialog.close();
});

taskCreateForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(taskCreateForm);
  const data = Object.fromEntries(formData.entries());

  data.status = "pending";
  data.priority = parseInt(data.priority, 10);
  data.createdAt = new Date().toLocaleString();
  data.updatedAt = new Date().toLocaleString();

  const lastTask = tasks[tasks.length - 1];
  data.id = lastTask ? `${parseInt(lastTask.id, 10) + 1}` : "1";
  tasks.push(data);

  localStorage.setItem("tasks", JSON.stringify(tasks));

  renderTask(data);

  taskCreateForm.reset();

  taskCreateDialog.close();
});

// Delete Task
function deleteTask(taskId) {
  const task = tasks.find((task) => task.id === taskId);
  if (!task) return;

  const taskDeleteDialog = document.getElementById("task-delete-dialog");
  document.getElementById("task-delete-display").value = task.display;

  const formNode = taskDeleteDialog.children[0];
  formNode.dataset.taskId = taskId;

  taskDeleteDialog.showModal();
}

const taskDeleteForm = document.getElementById("task-delete-form");
taskDeleteForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const taskId = taskDeleteForm.dataset.taskId;
  tasks = tasks.filter((task) => task.id !== taskId);

  localStorage.setItem("tasks", JSON.stringify(tasks));

  const taskItem = document.getElementById(`task-item-${taskId}`);
  if (taskItem) {
    taskListContainer.removeChild(taskItem);
  }

  document.getElementById("task-delete-dialog").close();
});

const taskDeleteCancel = document.getElementById("task-delete-cancel");
taskDeleteCancel.addEventListener("click", () => {
  document.getElementById("task-delete-dialog").close();
});

// View Task Details
function viewTask(taskId) {
  const task = tasks.find((task) => task.id === taskId);
  if (!task) return;

  const taskViewDialog = document.getElementById("task-view-dialog");

  document.getElementById("task-view-display").value = task.display;
  document.getElementById("task-view-description").value = task.description;
  document.getElementById("task-view-created").value = task.createdAt;
  document.getElementById("task-view-updated").value = task.updatedAt;
  document.getElementById("task-view-priority").value = task.priority;
  document.getElementById("task-view-due-date").value = task["due-date"];

  taskViewDialog.showModal();
}

// Edit Task Details
function editTask(taskId) {
  const task = tasks.find((task) => task.id === taskId);
  if (!task) return;

  const taskEditDialog = document.getElementById("task-edit-dialog");

  document.getElementById("task-edit-display").value = task.display;
  document.getElementById("task-edit-description").value = task.description;
  document.getElementById("task-edit-priority").value = task.priority;
  document.getElementById("task-edit-due-date").value = task["due-date"];

  const formNode = taskEditDialog.children[0];
  formNode.dataset.taskId = taskId;
  taskEditDialog.showModal();
}

const taskEditForm = document.getElementById("task-edit-form");
taskEditForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(taskEditForm);
  const data = Object.fromEntries(formData.entries());
  data.updatedAt = new Date().toLocaleString();

  const taskId = taskEditForm.dataset.taskId;
  tasks = tasks.map((task) =>
    task.id === taskId ? { ...task, ...data } : task
  );

  localStorage.setItem("tasks", JSON.stringify(tasks));

  const taskText = document.getElementById(`task-${taskId}-text`);
  if (taskText) {
    taskText.textContent = data.display;
  }

  taskEditForm.reset();

  document.getElementById("task-edit-dialog").close();
});

const taskEditCancel = document.getElementById("task-edit-cancel");
taskEditCancel.addEventListener("click", () => {
  document.getElementById("task-edit-dialog").close();
});

function toggleTaskCompletion(event) {
  const taskId = event.target.dataset.taskId;
  const taskText = document.getElementById(`task-${taskId}-text`);
  const editBtn = document.querySelector(
    `button.edit[data-task-id="${taskId}"]`
  );
  const taskItem = document.getElementById(`task-item-${taskId}`);
  const taskFilter = document.getElementById("task-filter");

  let status = "pending";
  if (event.target.checked) {
    taskText.style.textDecoration = "line-through";
    editBtn.setAttribute("disabled", "disabled");
    status = "completed";

    if (taskFilter.value === "pending") {
      taskListContainer.removeChild(taskItem);
    }
  } else {
    taskText.style.textDecoration = "none";
    editBtn.removeAttribute("disabled");
    editBtn.style.display = "block";

    if (taskFilter.value === "completed") {
      taskListContainer.removeChild(taskItem);
    }
  }

  tasks = tasks.map((task) =>
    task.id === taskId ? { ...task, ...{ status } } : task
  );

  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Applying filter using dropdown
const taskFilter = document.getElementById("task-filter");
taskFilter.addEventListener("change", (event) => {
  const status = event.target.value;
  taskListContainer.innerHTML = "";

  for (const task of tasks) {
    if (!status || task.status === status) {
      renderTask(task);
    }
  }
});

// Search tasks
const searchInput = document.querySelector("#task-search input");
const searchBtn = document.getElementById("task-search-btn");
searchBtn.addEventListener("click", () => {
  const textToSearch = searchInput.value;
  if (!textToSearch) return;

  const searchText = new RegExp(textToSearch, "i");
  const task = tasks.find((task) => {
    return task.display.match(searchText);
  });
  const filteredTasks = task ? [task] : [];

  taskListContainer.innerHTML = "";

  for (const task of filteredTasks) {
    renderTask(task);
  }

  searchInput.value = "";
});

// Clear filtered tasks
const clearSearchBtn = document.getElementById("clear-search-btn");
clearSearchBtn.addEventListener("click", () => {
  const taskFilter = document.getElementById("task-filter");
  taskFilter.value = "";
  taskListContainer.innerHTML = "";

  for (const task of tasks) {
    renderTask(task);
  }

  searchInput.value = "";
});
