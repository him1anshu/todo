export function logMessage(type, message, data = null) {
  const timestamp = new Date().toISOString();

  switch (type) {
    case "info":
      console.log(`[INFO] [${timestamp}]: ${message}`, data ?? "");
      break;
    case "warn":
      console.warn(`[WARN] [${timestamp}]: ${message}`, data ?? "");
      break;
    case "error":
      console.error(`[ERROR] [${timestamp}]: ${message}`, data ?? "");
      break;
    default:
      console.log(`[LOG] [${timestamp}]: ${message}`, data ?? "");
  }
}

export function updateDatePickerTheme() {
  const isDarkTheme =
    document.documentElement.getAttribute("data-theme") === "dark";

  document.body.classList.toggle("dark-theme", isDarkTheme);
}

const menuItems = [
  { label: "New Task", action: ctxTaskCreate, enabled: true },
  {
    label: "Sort (Priority)",
    action: ctxSortTasks,
    params: "priority",
    enabled: true,
  },
  {
    label: "Sort (Due Date)",
    action: ctxSortTasks,
    params: "due_date",
    enabled: true,
  },
  {
    label: "Pending tasks",
    action: ctxFilterTasks,
    params: "pending",
    enabled: true,
  },
  {
    label: "Completed tasks",
    action: ctxFilterTasks,
    params: "completed",
    enabled: true,
  },
  { label: "Reset Filters", action: ctxClearFilters, enabled: true },
  // { label: "Undo", action: undoRedoManager.undo, enabled: true },
  // { label: "Redo", action: undoRedoManager.undo, enabled: true },
  // { label: "Redo", action: null, enabled: false },
];

function ctxTaskCreate() {
  document.getElementById("task-add-btn").click();
}

function ctxSortTasks(sortBy) {
  const sortByEle = document.getElementById("sort-by");
  sortByEle.value = sortBy;
  sortByEle.dispatchEvent(new Event("change"));
}

function ctxFilterTasks(status) {
  const filterTaskEle = document.getElementById("task-filter");
  filterTaskEle.value = status;
  filterTaskEle.dispatchEvent(new Event("change"));
}

function ctxClearFilters() {
  document.getElementById("clear-search-btn").click();
}

export function showContextMenu(x, y) {
  const menu = document.getElementById("context-menu");
  menu.innerHTML = "";

  menuItems.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item.label;

    if (item.enabled) {
      li.onclick = () => {
        if (item.params) {
          item.action(item.params);
        } else {
          item.action();
        }
      };
    } else {
      li.classList.add("disabled");
    }

    menu.appendChild(li);
  });

  positionMenu(menu, x, y);
}

function positionMenu(menu, x, y) {
  const { innerWidth, innerHeight } = window;

  menu.classList.remove("hidden");
  const { offsetWidth, offsetHeight } = menu;

  // Adjust if it overflows
  if (x + offsetWidth > innerWidth) x -= offsetWidth;
  if (y + offsetHeight > innerHeight) y -= offsetHeight;

  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
}

export function hideContextMenu() {
  document.getElementById("context-menu").classList.add("hidden");
}
