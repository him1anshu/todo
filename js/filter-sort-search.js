import { getObjectStore, renderAllTasks } from "./db";
import { renderTask } from "./ui";

const taskListContainer = document.getElementById("task-list");

export function clearFilters() {
  document.getElementById("task-filter").value = "";
  document.getElementById("sort-by").value = "";
  document.querySelector("#task-search input").value = "";

  taskListContainer.innerHTML = "";

  renderAllTasks();
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

      tasksToBeSorted.forEach((task) =>
        taskListContainer.appendChild(renderTask(task, false))
      );
    }
  });
}

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
          taskListContainer.appendChild(taskItem);
        }
        cursor.continue();
      }
    });
  });

document
  .getElementById("clear-search-btn")
  .addEventListener("click", clearFilters);
