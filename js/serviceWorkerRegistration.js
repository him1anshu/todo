import { logMessage } from "./utility.js";
import { checkDueTasks } from "./task-manager.js";

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

      // Register periodic background sync if supported
      if ("periodicSync" in registration) {
        try {
          const status = await navigator.permissions.query({
            name: "periodic-background-sync",
          });

          if (status.state === "granted") {
            await registration.periodicSync.register("check-tasks", {
              minInterval: 60 * 60 * 1000, // 1 hour
            });

            logMessage("log", "Periodic Sync registered successfully!");
          } else {
            logMessage(
              "warn",
              "Periodic Sync permission denied. Ensure this is a PWA."
            );
          }
        } catch (err) {
          logMessage("error", "Periodic Sync registration failed:", err);
        }
      } else {
        logMessage("warn", "Periodic Sync is not supported in this browser.");
      }

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener("message", async (event) => {
        if (event.data.action === "checkDueTasks") {
          await checkDueTasks(true);
        }
      });
    } catch (error) {
      logMessage("error", "Service Worker registration failed:", error);
    }
  }
};
