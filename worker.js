const CACHE_NAME = "task-manager-v3";
const URLS_TO_CACHE = [
  "/",
  "/index.html",
  "/css/styles.css",
  "/js/commands.js",
  "/js/db.js",
  "/js/drag-drop.js",
  "/js/script.js",
  "/js/serviceWorkerRegistration.js",
  "/js/task-manager.js",
  "/js/ui.js",
  "/js/undo-redo.js",
  "/js/utility.js",
  "/assets/task-manager-logo.png",
  "/og-image.png",
  "/apple-touch-icon.png",
  "/favicon-96x96.png",
  "/favicon.ico",
  "/favicon.svg",
  "/manifest.json",
  "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap",
  "https://fonts.gstatic.com/s/roboto/v47/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3yUBA.woff2",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/webfonts/fa-solid-900.woff2",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/webfonts/fa-regular-400.woff2",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(URLS_TO_CACHE);
      } catch (error) {
        console.error("[SW] Install Error:", error);
      }
    })()
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter((cache) => cache !== CACHE_NAME)
            .map((cache) => caches.delete(cache))
        );

        await self.clients.claim();
      } catch (error) {
        console.error("[SW] Activation Error:", error);
      }
    })()
  );
});

const putInCache = async (request, response) => {
  if (!response || response.status !== 200) {
    console.warn(`[SW] Skipping cache update for: ${request.url}`);
    return;
  }
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response);
  } catch (error) {
    console.error("[SW] Cache Put Error:", error);
  }
};

const networkFirst = async (request) => {
  try {
    const responseFromNetwork = await fetch(request);
    if (!responseFromNetwork || responseFromNetwork.status !== 200) {
      throw new Error(
        `Bad response: ${responseFromNetwork}, ${responseFromNetwork.status}`
      );
    }
    putInCache(request, responseFromNetwork.clone());
    return responseFromNetwork;
  } catch (error) {
    console.warn(
      `[SW] Network error for ${request.url}, falling back to cache:`,
      error
    );
    const cachedResponse = await caches.match(request);
    return (
      cachedResponse ||
      new Response("Network error and no cache available", { status: 503 })
    );
  }
};

// const staleWhileRevalidate = async (request) => {
//   try {
//     const cache = await caches.open(CACHE_NAME);
//     const cachedResponse = await cache.match(request);

//     const fetchPromise = fetch(request)
//       .then(async (response) => {
//         if (!response || response.status !== 200) {
//           throw new Error(
//             `Bad response: ${JSON.stringify(response)}, ${response.status}`
//           );
//         }
//         await cache.put(request, response.clone());
//         return response;
//       })
//       .catch((error) =>
//         console.warn(`[SW] Fetch error for ${request.url}:`, error)
//       );

//     return (
//       cachedResponse ||
//       (await fetchPromise) ||
//       new Response("Offline and resource not cached", { status: 503 })
//     );
//   } catch (error) {
//     console.error(`[SW] SWR error for ${request.url}:`, error);
//     return new Response("Error fetching resource", { status: 500 });
//   }
// };

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // if (request.url.includes("/js/")) {
  //   event.respondWith(networkFirst(request));
  // } else {
  //   event.respondWith(staleWhileRevalidate(request));
  // }

  event.respondWith(networkFirst(request));
});

self.addEventListener("periodicsync", async (event) => {
  if (event.tag === "check-tasks") {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) =>
          client.postMessage({ action: "checkDueTasks" })
        );
      })
    );
  }
});

self.addEventListener("message", (event) => {
  if (event.data.action === "sendNotification") {
    const { title, message } = event.data;
    self.registration.showNotification(title, {
      body: message,
      icon: "../og-image.png",
    });
  }
});
