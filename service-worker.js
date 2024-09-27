const CACHE_NAME = "procrastinot-cache-v1";
const urlsToCache = ["/", "/index.html", "/manifest.json", "/css/styles.css", "/js/app.js", "/icons/icon-192x192.png", "/icons/icon-512x512.png"];

// Install the service worker
self.addEventListener("install", function (event) {
	event.waitUntil(
		caches.open(CACHE_NAME).then(function (cache) {
			return cache.addAll(urlsToCache);
		})
	);
});

// Fetch resources
self.addEventListener("fetch", function (event) {
	event.respondWith(
		caches.match(event.request).then(function (response) {
			return response || fetch(event.request);
		})
	);
});

// Update the service worker
self.addEventListener("activate", function (event) {
	const cacheWhitelist = [CACHE_NAME];
	event.waitUntil(
		caches.keys().then(function (cacheNames) {
			return Promise.all(
				cacheNames.map(function (cacheName) {
					if (cacheWhitelist.indexOf(cacheName) === -1) {
						return caches.delete(cacheName);
					}
				})
			);
		})
	);
});
