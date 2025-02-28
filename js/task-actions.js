import { getObjectStore } from "./db";
import { pushDataToStack } from "./history-stack";
import { renderTask } from "./rendering-task";
import { sortTasks } from "./filter-sort-search";

const taskListContainer = document.getElementById("task-list");

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
export function showCreateTaskModal() {
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

document.getElementById("task-create-cancel").addEventListener("click", () => {
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
          taskListContainer.appendChild(renderTask(newTask));
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
document.getElementById("task-delete-cancel")?.addEventListener("click", () => {
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

          taskListContainer.replaceChild(
            renderTask(task, isDraggable),
            taskItem
          );
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
