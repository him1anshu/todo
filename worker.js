// self.console.log(self.location);

const addResourcesToCache = async (resources) => {
  const cache = await caches.open("task-manager-v1");
  await cache.addAll(resources);
};

const putInCache = async (request, response) => {
  const cache = await caches.open("task-manager-v1");
  await cache.put(request, response);
};

const cacheFirst = async (request, event) => {
  const responseFromCache = await caches.match(request);
  if (responseFromCache) {
    return responseFromCache;
  }
  const responseFromNetwork = await fetch(request);
  event.waitUntil(putInCache(request, responseFromNetwork.clone()));
  return responseFromNetwork;
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    addResourcesToCache([
      "/",
      "/index.html",
      "/css/styles.css",
      "/js/script.js",
      "/assets/task-manager-logo.png",
      "/og-image.png",
      "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap",
      "https://fonts.gstatic.com/s/roboto/v47/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3yUBA.woff2",
      "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css",
      "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/webfonts/fa-solid-900.woff2",
      "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/webfonts/fa-regular-400.woff2",
    ])
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(cacheFirst(event.request, event));
});
