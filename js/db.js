import { logMessage } from "./utility.js";

const DB_NAME = "task-manager-db";
const DB_VERSION = 2;
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
        logMessage("error", "Database error: ", event.target.error?.message);
      });

      if (!db.objectStoreNames.contains(DB_STORE_NAME)) {
        const objectStore = db.createObjectStore(DB_STORE_NAME, {
          keyPath: "id",
        });

        objectStore.createIndex("id", "id", { unique: true });
        objectStore.createIndex("display", "display", { unique: false });
        objectStore.createIndex("position", "position", { unique: false });
        objectStore.createIndex("status", "status", { unique: false });
      } else {
        // Open the existing store and add missing indexes if necessary
        const objectStore = event.target.transaction.objectStore(DB_STORE_NAME);

        if (!objectStore.indexNames.contains("display")) {
          objectStore.createIndex("display", "display", { unique: false });
        }
        if (!objectStore.indexNames.contains("position")) {
          objectStore.createIndex("position", "position", { unique: false });
        }
        if (!objectStore.indexNames.contains("status")) {
          objectStore.createIndex("status", "status", { unique: false });
        }
      }
    });

    request.addEventListener("success", (event) => {
      db = event.target.result;
      resolve(event.target.result);
    });

    request.addEventListener("error", (event) => {
      logMessage(
        "error",
        "Application not allowed to use IndexedDB for storage, please allow it."
      );
    });
  });
}

export function getAllTasks(db, mode) {
  return new Promise((resolve, reject) => {
    const objectStore = getObjectStore(db, mode);
    const request = objectStore.getAll();
    request.addEventListener("success", () => {
      resolve(request.result);
    });

    request.addEventListener("error", () => {
      reject(request.error);
    });
  });
}

export function getAllTasksByIndex(db, mode, indexName, range = null) {
  return new Promise((resolve, reject) => {
    const objectStore = getObjectStore(db, mode);
    const index = objectStore.index(indexName);
    const request = index.getAll();
    request.addEventListener("success", () => {
      resolve(request.result);
    });

    request.addEventListener("error", () => {
      reject(error);
    });
  });
}

export function getTask(db, mode, key) {
  return new Promise((resolve, reject) => {
    const objectStore = getObjectStore(db, mode);
    const request = objectStore.get(key);
    request.addEventListener("success", () => {
      resolve(request.result);
    });

    request.addEventListener("error", () => {
      reject(request.error);
    });
  });
}

export function addTask(db, mode, data) {
  return new Promise((resolve, reject) => {
    const objectStore = getObjectStore(db, mode);
    const request = objectStore.add(data);
    request.addEventListener("success", () => {
      resolve(request.result);
    });

    request.addEventListener("error", () => {
      reject(request.error);
    });
  });
}

export function deleteTask(db, mode, key) {
  return new Promise((resolve, reject) => {
    const objectStore = getObjectStore(db, mode);
    const request = objectStore.delete(key);
    request.addEventListener("success", () => {
      resolve("Deleted");
    });

    request.addEventListener("error", () => {
      reject(request.error);
    });
  });
}

export function putTask(db, mode, data) {
  return new Promise((resolve, reject) => {
    const objectStore = getObjectStore(db, mode);
    const request = objectStore.put(data);
    request.addEventListener("success", () => {
      resolve(request.result);
    });

    request.addEventListener("error", () => {
      reject(request.error);
    });
  });
}
