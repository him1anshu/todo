import { showCreateTaskModal } from "./task-actions";
import { clearFilters } from "./filter-sort-search";
import { undoLatestTaskEvent, redoLatestTaskEvent } from "./history-stack";

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
