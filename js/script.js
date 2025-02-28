import { registerServiceWorker } from "./serviceWorkerRegistration.js";
import { updateDatePickerTheme } from "./date-picker-theme.js";
import { dragoverHandler, dropHandler } from "./drag-drop.js";
import { openDBConnection } from "./db.js";
(function () {
  let db;
  let latestPosition;

  const taskListContainer = document.getElementById("task-list");
  let tasks = [];

  registerServiceWorker();

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

    db = updateDatePickerTheme();

    taskListContainer.innerHTML = "";

    openDBConnection();
  });

  /*========================
    Attach Drag & Drop Listeners
  ========================*/
  taskListContainer.addEventListener("dragover", dragoverHandler);
  taskListContainer.addEventListener("drop", dropHandler);
})();
