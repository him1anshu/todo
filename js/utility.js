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
