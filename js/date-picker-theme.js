const datePickerStyle = document.createElement("style");
document.head.appendChild(datePickerStyle);

export function updateDatePickerTheme() {
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
