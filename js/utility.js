import {
  touchStartHandler,
  touchMoveHandler,
  touchEndHandler,
} from "./drag-drop.js";

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

export function sendNotification(title, message) {
  if (Notification.permission === "granted") {
    new Notification(title, {
      body: message,
      icon: "../og-image.png",
    });
  }
}

const menuItems = [
  {
    label: "New Task",
    action: ctxTaskCreate,
    icon: "fa-plus",
    // shortcut: "Ctrl+N",
    enabled: true,
  },
  {
    label: "Sort by Priority",
    action: ctxSortTasks,
    icon: "fa-arrow-up-wide-short",
    params: "priority",
    // shortcut: "Ctrl+Shift+P",
    enabled: true,
  },
  {
    label: "Sort by Due Date",
    action: ctxSortTasks,
    icon: "fa-calendar-days",
    params: "due_date",
    // shortcut: "Ctrl+Shift+D",
    enabled: true,
  },
  {
    label: "Show Pending",
    action: ctxFilterTasks,
    icon: "fa-hourglass-half",
    params: "pending",
    // shortcut: "Ctrl+Alt+P",
    enabled: true,
  },
  {
    label: "Show Completed",
    action: ctxFilterTasks,
    icon: "fa-circle-check",
    params: "completed",
    // shortcut: "Ctrl+Alt+C",
    enabled: true,
  },
  {
    label: "Reset Filters",
    action: ctxClearFilters,
    icon: "fa-filter-circle-xmark",
    // shortcut: "Ctrl+Alt+R",
    enabled: true,
  },
  // {
  //   label: "Undo",
  //   action: undoRedoManager.undo,
  //   icon: "fa-rotate-left",
  //   shortcut: "Ctrl+Z",
  //   enabled: undoRedoManager.hasUndo(),
  // },
  // {
  //   label: "Redo",
  //   action: undoRedoManager.redo,
  //   icon: "fa-rotate-right",
  //   shortcut: "Ctrl+Shift+Z",
  //   enabled: undoRedoManager.hasRedo(),
  // },
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

// State Management
let touchTimer;
let isDragging;
let currentSelectionIndex = -1;
let touchStartPosition = null;
const contextMenu = document.getElementById("context-menu");

export function handleContextMenu(event) {
  event.preventDefault();
  showContextMenu(event.clientX, event.clientY);
  addMenuAnimation();
}

export function handleClickOutside(event) {
  hideContextMenu();
}

export function handleTouchStart(event) {
  const dragButton = event.target.closest(".task-drag-container");

  if (dragButton) {
    clearTimeout(touchTimer);
    isDragging = true;
    touchStartHandler(event);
    return; // Skip setting touchTimer for the context menu
  }

  // Regular touch logic for context menu
  touchStartPosition = {
    x: event.touches[0].clientX,
    y: event.touches[0].clientY,
  };

  touchTimer = setTimeout(() => {
    if (!isDragging) {
      // Only show menu if not dragging
      showContextMenu(touchStartPosition.x, touchStartPosition.y);
      provideHapticFeedback();
    }
  }, 500);
}

// In handleTouchMove function:
export function handleTouchMove(event) {
  if (isDragging) {
    touchMoveHandler(event);
    event.preventDefault();
  } else {
    if (touchStartPosition) {
      const moveThreshold = 10;
      const deltaX = Math.abs(event.touches[0].clientX - touchStartPosition.x);
      const deltaY = Math.abs(event.touches[0].clientY - touchStartPosition.y);

      if (deltaX > moveThreshold || deltaY > moveThreshold) {
        clearTimeout(touchTimer);
        touchStartPosition = null;
        return;
      }
    }
  }
}

export function handleTouchEnd(event) {
  if (isDragging) {
    touchEndHandler(event);
    isDragging = false;
  } else {
    clearTimeout(touchTimer);
    touchStartPosition = null;
  }
}

export function showContextMenu(x, y) {
  buildMenuItems();
  positionMenu(x, y);
  contextMenu.classList.remove("hidden");
  contextMenu.classList.add("visible");
}

function buildMenuItems() {
  contextMenu.innerHTML = ""; // Clear previous menu items

  menuItems.forEach((item, index) => {
    const li = document.createElement("li");
    li.setAttribute("role", "menuitem");
    li.setAttribute("tabindex", item.enabled ? "0" : "-1");
    li.dataset.index = index;

    // Create the icon element
    const icon = document.createElement("i");
    icon.className = `fa-solid ${item.icon}`;

    // Create text node for the label
    const label = document.createTextNode(` ${item.label}`);

    // Append icon and label to li
    li.appendChild(icon);
    li.appendChild(label);

    if (item.enabled) {
      li.addEventListener("click", handleMenuItemClick);
      li.addEventListener("keydown", handleMenuItemKeyPress);
    } else {
      li.classList.add("disabled");
    }

    contextMenu.appendChild(li);
  });
}

function positionMenu(x, y) {
  const menuRect = contextMenu.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Adjust horizontal position
  x =
    x + menuRect.width > viewportWidth
      ? viewportWidth - menuRect.width - 10
      : x;

  // Adjust vertical position
  y =
    y + menuRect.height > viewportHeight
      ? viewportHeight - menuRect.height - 10
      : y;

  contextMenu.style.left = `${x}px`;
  contextMenu.style.top = `${y}px`;
}

function handleMenuItemClick(event) {
  const index = event.currentTarget.dataset.index;
  activateMenuItem(index);
}

function handleMenuItemKeyPress(event) {
  const { key } = event;
  const index = parseInt(event.currentTarget.dataset.index, 10);

  if (key === "Enter" || key === " ") {
    activateMenuItem(index);
  }
}

function activateMenuItem(index) {
  const item = menuItems[index];
  if (item?.enabled) {
    item.action(item.params);
  }
}

export function hideContextMenu() {
  contextMenu.classList.remove("visible");
  contextMenu.classList.add("hidden");
  currentSelectionIndex = -1;
}

function addMenuAnimation() {
  contextMenu.style.transform = "scale(0.98)";
  setTimeout(() => {
    contextMenu.style.transform = "scale(1)";
  }, 50);
}

function provideHapticFeedback() {
  if (navigator.vibrate) {
    navigator.vibrate([50]);
  } else if (navigator.webkitVibrate) {
    navigator.webkitVibrate([50]);
  }
}

export function handleKeyNavigation(event) {
  if (!contextMenu.classList.contains("visible")) return;

  const items = Array.from(contextMenu.querySelectorAll("li:not(.disabled)"));
  if (!items.length) return;

  switch (event.key) {
    case "ArrowDown":
      event.preventDefault();
      navigateMenu(1, items);
      break;
    case "ArrowUp":
      event.preventDefault();
      navigateMenu(-1, items);
      break;
    case "Escape":
      hideContextMenu();
      break;
    case "Enter":
    case " ":
      if (currentSelectionIndex !== -1) {
        items[currentSelectionIndex].click();
      }
      break;
    case "Tab":
      event.preventDefault();
      navigateMenu(event.shiftKey ? -1 : 1, items);
      break;
  }
}

function navigateMenu(direction, items) {
  currentSelectionIndex = Math.max(
    0,
    Math.min(items.length - 1, currentSelectionIndex + direction)
  );

  items.forEach((item, index) => {
    item.classList.toggle("selected", index === currentSelectionIndex);
    item.tabIndex = index === currentSelectionIndex ? 0 : -1;
  });

  items[currentSelectionIndex].focus();
  scrollIntoViewIfNeeded(items[currentSelectionIndex]);
}

function scrollIntoViewIfNeeded(element) {
  const menu = contextMenu;
  const elementRect = element.getBoundingClientRect();
  const menuRect = menu.getBoundingClientRect();

  if (elementRect.bottom > menuRect.bottom) {
    menu.scrollTop += elementRect.bottom - menuRect.bottom;
  } else if (elementRect.top < menuRect.top) {
    menu.scrollTop -= menuRect.top - elementRect.top;
  }
}
