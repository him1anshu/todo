export function updateDatePickerTheme() {
  const isDarkTheme =
    document.documentElement.getAttribute("data-theme") === "dark";

  document.body.classList.toggle("dark-theme", isDarkTheme);
}
