const DB_NAME = "task-manager-db";
const DB_VERSION = 1;
const DB_STORE_NAME = "tasks";

let db;

export function getObjectStore(store_name, mode) {
  const transaction = db.transaction(store_name, mode);
  return transaction.objectStore(store_name);
}

export function openDBConnection() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.addEventListener("upgradeneeded", (event) => {
      db = event.target.result; // Assign db

      db.addEventListener("error", (event) => {
        console.error(`Database error: ${event.target.error?.message}`);
      });

      const objectStore = db.createObjectStore(DB_STORE_NAME, {
        keyPath: "id",
      });

      objectStore.createIndex("id", "id", { unique: true });
      objectStore.createIndex("display", "display", { unique: false });
      objectStore.createIndex("position", "position", { unique: false });
    });

    request.addEventListener("success", (event) => {
      db = event.target.result;
      resolve(event.target.result);
    });

    request.addEventListener("error", (event) => {
      console.error(
        "Application not allowed to use IndexedDB for storage, please allow it."
      );
    });
  });
}
