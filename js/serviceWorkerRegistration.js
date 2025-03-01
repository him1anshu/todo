import { logMessage } from "./utility.js";

export const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register(
        "/worker.js",
        {
          scope: "/",
        }
      );
      if (registration.installing) {
        logMessage("log", "Service worker installing");
      } else if (registration.waiting) {
        logMessage("log", "Service worker installed");
      } else if (registration.active) {
        logMessage("log", "Service worker active");
      }
    } catch (error) {
      logMessage("error", "Registration failed with error: ", error);
    }
  }
};
